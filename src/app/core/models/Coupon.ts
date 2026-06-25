export interface CouponValidationResponse {
    valid: boolean;
    message?: string;
    coupon?: any;
    price: number;
    discount_amount: number;
    final_amount: number;
}