import { MangaTile, SearchRequest } from "paperback-extensions-common";
import CryptoJS from "crypto-js";

const entities = require("entities");

export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const generateSearch = (query: SearchRequest): string => {
    const keyword: string = query.title ?? "";
    return encodeURI(keyword);
};

export const parseSearch = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    $('#archive-list-table li').each((_, element) => {
        const title = $('.super-title a', element).text().trim();
        const image = $('img', element).attr('src') || "";
        const id = $('.super-title > a', element).first().attr('href');
        if (!id) return;
        manga.push(createMangaTile({
            id: id ?? "",
            image: image.replace('150x150', '300x404'),
            title: createIconText({ text: title }),
        }));
    });
    return manga;
};

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    $('.comic-item', '.col-md-9 > .comic-list ').each((_, element) => {
        const title = $('.comic-title', element).text().trim();
        const image = $('.img-thumbnail', element).attr('data-thumb') || "";
        const id = $('.comic-img > a', element).first().attr('href');
        const subtitle = $('.comic-chapter', element).text().trim();
        manga.push(createMangaTile({
            id: id ?? "",
            image: image.replace('150x150', '300x404') ?? "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    });
    return manga;
};

export const isLastPage = ($: CheerioStatic): boolean => {
    const pages: number[] = [];

    $('ul.pagination li').each((_, page) => {
        const p = Number($('a', page).text().trim());
        if (!isNaN(p)) pages.push(p);
    });

    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li.active > span").text().trim());
    return currentPage >= lastPage;
};

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
};

export const decryptImages = ($: any, tis: any): string[] => {
    const pages: string[] = [];

    const htmlContent = $('#view-chapter').html().match(/htmlContent="(.+)"/)[0]
        .replace('htmlContent="', "")
        .replace('"}"', '"}')
        .replace(/\\\\/g, '')
        .replace(/\\\"/g, '"');

    function CryptoJSAesDecrypt(passphrase: any, encrypted_json_string: any) {
        const obj_json = JSON.parse(encrypted_json_string);
        const encrypted = obj_json.ciphertext;
        const salt = CryptoJS.enc.Hex.parse(obj_json.salt);
        const iv = CryptoJS.enc.Hex.parse(obj_json.iv);
        const key = CryptoJS.PBKDF2(passphrase, salt, {
            hasher: CryptoJS.algo.SHA512,
            keySize: 64 / 8,
            iterations: 999
        });
        const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
            iv: iv
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }

    let chapterHTML = CryptoJSAesDecrypt('EhwuFp' + 'SJkhMV' + 'uUPzrw', htmlContent);
    chapterHTML = chapterHTML.replace(/EhwuFp/g, '.');
    chapterHTML = chapterHTML.replace(/SJkhMV/g, ':');
    chapterHTML = chapterHTML.replace(/uUPzrw/g, '/');

    const $2 = tis.cheerio.load(chapterHTML);
    const cc = $2('img').toArray();

    for (const el of cc) {
        const dataEhwufp = $2(el).attr('data-ehwufp');
        if (dataEhwufp) pages.push(dataEhwufp);
    }

    return pages;
};