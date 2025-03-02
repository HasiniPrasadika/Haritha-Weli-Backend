//message, statusCode, errorCode

export class HttpException extends Error{
    message: string;
    errorCode: any;
    statusCode: number;
    errors: ErrorCode;

    constructor(message:string, errorCode: ErrorCode, statusCode: number, error: any){
        super(message)
        this.message = message
        this.errorCode = errorCode
        this.statusCode = statusCode
        this.errors = error
    }
}

export enum ErrorCode {
    USER_NOT_FOUND = 1001,
    USER_ALREADY_EXISTS = 1002,
    INCORRECT_PASSWORD = 1003,
    ADDRESS_NOT_FOUND = 1004,
    ADDRESS_DOES_NOT_BELONG = 1005,
    INCORRECT_CURRENT_PASSWORD = 1006,
    USER_IS_NOT_AN_AGENT = 1007,
    USER_IS_NOT_AN_REP = 1007,


    UNPROCESSABLE_ENTITY = 2001,

    INTERNAL_EXCEPTION = 3001,

    UNAUTHORIZED = 4001,
    AGENT_ALREADY_ASSIGNED = 4002,
    REP_ALREADY_ASSIGNED = 4003,


    PRODUCT_NOT_FOUND = 5001,
    PRODUCT_ALREADY_EXISTS = 5002,
    PRODUCT_ALREADY_ADDED = 5003,
    PRODUCT_NOT_ADDED = 5004,
    OUT_OF_STOCK = 5005,

    ORDER_NOT_FOUND = 6001,  
    
    INVALID_OR_EXPIRED_RESET_TOKEN = 7001,

    INVALID_BRANCH_ID = 8001,
    BRANCH_NOT_FOUND = 8002,
   
}