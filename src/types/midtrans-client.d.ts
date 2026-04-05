declare module 'midtrans-client' {
  interface SnapConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface CustomerDetails {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  }

  interface ItemDetails {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }

  interface Callbacks {
    finish?: string;
    error?: string;
    pending?: string;
  }

  interface TransactionParameter {
    transaction_details: TransactionDetails;
    customer_details?: CustomerDetails;
    item_details?: ItemDetails[];
    callbacks?: Callbacks;
  }

  interface TransactionResponse {
    token: string;
    redirect_url: string;
  }

  interface TransactionStatus {
    transaction_id: string;
    order_id: string;
    status_code: string;
    transaction_status: string;
    gross_amount: string;
    payment_type: string;
    transaction_time: string;
    fraud_status?: string;
    bank?: string;
    va_number?: string;
    permata_va_number?: string;
    bill_key?: string;
    biller_code?: string;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(parameter: TransactionParameter): Promise<TransactionResponse>;
    transaction: {
      status(orderId: string): Promise<TransactionStatus>;
    };
  }

  export default Snap;
}