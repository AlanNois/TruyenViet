import { MangaTile, SearchRequest } from "paperback-extensions-common";
import { DOMAIN } from "./CManga";

const entities = require("entities"); //Import package for decoding HTML entities
export interface UpdatedManga {
    ids: string[];
    loadMore: boolean;
}

export const generateSearch = (query: SearchRequest): string =>
    encodeURI(query.title ?? "");


export const parseSearch = (json: any, search: any): MangaTile[] => {
    const manga: MangaTile[] = [];

    const getData = (item: any) => ({
        id: `${item.url}-${item.id_book}`,
        image: `${DOMAIN}assets/tmp/book/avatar/${item.avatar}.jpg`,
        title: createIconText({
            text: titleCase(item.name),
        }),
        subtitleText: createIconText({
            text: search.top !== '' ? `${Number(item.total_view).toLocaleString()} views` : `Chap ${item.last_chapter}`,
        }),
    });

    const itemList = search.top !== '' ? json[search.top] : json;
    for (const i of Object.keys(itemList)) {
        const item = itemList[i];
        if (!item.name) continue;
        manga.push(createMangaTile(getData(item)));
    }

    return manga;
};

export const parseViewMore = (json: any): MangaTile[] => {
    const manga: MangaTile[] = [];

    const getData = (item: any) => ({
        id: `${item.url}-${item.id_book}`,
        image: `${DOMAIN}assets/tmp/book/avatar/${item.avatar}.jpg`,
        title: createIconText({
            text: titleCase(item.name),
        }),
        subtitleText: createIconText({
            text: `Chap ${item.last_chapter}`,
        }),
    });

    for (const i of Object.keys(json)) {
        const item = json[i];
        if (!item.name) continue;
        manga.push(createMangaTile(getData(item)));
    }

    return manga;
};

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}

export function decrypt_data(data: any) {
    const CryptoJS = require('crypto-js');
    const parsed = data;
    const type = parsed.ciphertext;
    const score = CryptoJS.enc.Hex.parse(parsed.iv);
    const lastviewmatrix = CryptoJS.enc.Hex.parse(parsed.salt);
    const adjustedLevel = CryptoJS.PBKDF2("nettruyenhayvn", lastviewmatrix, {
        hasher: CryptoJS.algo.SHA512,
        keySize: 64 / 8,
        iterations: 999,
    });
    const queryTokenScores = { iv: '' };
    queryTokenScores["iv"] = score;
    const pixelSizeTargetMax = CryptoJS.AES.decrypt(
        type,
        adjustedLevel,
        queryTokenScores
    );
    return pixelSizeTargetMax.toString(CryptoJS.enc.Utf8);
}

export function titleCase(str: any) {   //https://stackoverflow.com/questions/32589197/how-can-i-capitalize-the-first-letter-of-each-word-in-a-string-using-javascript
    var splitStr = str.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
        // You do not need to check if i is larger than splitStr length, as your for does that for you
        // Assign it back to the array
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    // Directly return the joined string
    return splitStr.join(' ');
}

export function change_alias(alias: any) {
    var str = alias;
    str = str.toLowerCase().trim();

    const charMap: { [key: string]: string } = {
        à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
        ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
        â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
        đ: 'd',
        è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
        ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
        ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
        ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
        ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
        ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
        ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
        ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
        ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
    };

    // Replace Vietnamese characters with their non-diacritic counterparts
    str = str.replace(/[\u0300-\u036f]/g, match => charMap[match] || '');

    // Replace spaces with hyphens
    str = str.replace(/\s+/g, '-');

    // Remove consecutive hyphens
    str = str.replace(/-{2,}/g, '-');

    return str;
}