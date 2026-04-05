import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isMentor, isAdmin } from '@/lib/auth';
import crypto from 'crypto';

// File signature (magic bytes) validation for security
const FILE_SIGNATURES: Record<string, { bytes: number[]; offset?: number }> = {
  'image/jpeg': { bytes: [0xFF, 0xD8, 0xFF] },
  'image/png': { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  'image/gif': { bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  'application/pdf': { bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  'video/mp4': { bytes: [0x00, 0x00, 0x00] }, // MP4 has various signatures, check ftyp later
  'video/webm': { bytes: [0x1A, 0x45, 0xDF, 0xA3] },
  'video/quicktime': { bytes: [0x00, 0x00, 0x00] }, // MOV has various signatures
};

// Dangerous file extensions that should never be allowed
const BLOCKED_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'sh', 'php', 'phtml', 'php3', 'php4', 'php5', 'phar',
  'jsp', 'jspx', 'asp', 'aspx', 'cgi', 'pl', 'py', 'rb', 'htaccess', 'htpasswd',
  'html', 'htm', 'svg', 'svgz', // SVG can contain scripts
];

function validateFileSignature(buffer: Buffer, claimedType: string): boolean {
  const signature = FILE_SIGNATURES[claimedType];
  if (!signature) {
    // For types without signature validation, allow but log warning
    console.warn(`[Upload] No signature validation for type: ${claimedType}`);
    return true;
  }

  const { bytes, offset = 0 } = signature;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) {
      return false;
    }
  }
  return true;
}

function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts and null bytes
  return filename
    .replace(/\.\./g, '')
    .replace(/\0/g, '')
    .replace(/[<>:"|?*\x00-\x1f]/g, '_');
}

// POST - Upload file to course-materials bucket
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const canUpload = await isMentor();
    if (!canUpload) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Mentor or Admin only' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = sanitizeFilename(formData.get('folder') as string || 'general');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 500MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png', 'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // SECURITY: Check file extension against blocklist
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (BLOCKED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { success: false, error: 'File extension not allowed for security reasons' },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer for validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // SECURITY: Validate file signature (magic bytes)
    if (!validateFileSignature(buffer, file.type)) {
      return NextResponse.json(
        { success: false, error: 'File content does not match the claimed file type' },
        { status: 400 }
      );
    }

    // SECURITY: Generate cryptographically secure random filename
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const safeExtension = extension.replace(/[^a-z0-9]/g, '');
    const fileName = `${timestamp}-${randomBytes}.${safeExtension}`;
    const filePath = `${folder}/${fileName}`;

    const supabase = createAdminClient();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('course-materials')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove file from storage
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const canDelete = await isMentor();
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Mentor or Admin only' },
        { status: 403 }
      );
    }

    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Path is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase.storage
      .from('course-materials')
      .remove([path]);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}