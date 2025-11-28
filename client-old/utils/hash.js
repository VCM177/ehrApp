import CryptoJS from 'crypto-js';

// Hash a string using SHA256 and convert to hex format
export const hashSHA256 = (text) => {
    return '0x' + CryptoJS.SHA256(text).toString();
};
