import {
    pick
} from 'lodash';

import {
    sign,
} from 'jsonwebtoken';


export const issueAuthToken = async (jwtPayload) => {
    let token = await sign(jwtPayload, process.env.SECRET_ACCESS_KEY, {
        expiresIn:process.env.SECRET_ACCESS_TIME
    });
    return `Bearer ${token}`;
};


export const issueAuthRefreshToken = async (jwtPayload) => {
    let token = await sign(jwtPayload, process.env.SECRET_REFRESH_KEY, {
        expiresIn: process.env.SECRET_REFRESH_TIME
    });
    return `Bearer ${token}`;
}

export const serializeUser = user => pick(user, [
    'id',
    'email',
    'username',
    'lastName',
    'firstName',
    'roles',
    'tel',
    'pages'
]);


