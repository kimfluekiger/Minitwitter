import {rateLimit} from 'express-rate-limit'


export const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 1000, // limit each IP to 1000 requests per windowMs
    legacyHeaders: false,
})