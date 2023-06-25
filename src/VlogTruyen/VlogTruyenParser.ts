import { MangaTile, SearchRequest } from "paperback-extensions-common";

const entities = require("entities");

export function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const generateSearch = (query: SearchRequest): string => {
    const keyword: string = query.title ?? "";
    return encodeURI(keyword);
};

export const parseSearch = ($: CheerioStatic, query: SearchRequest, tags: string[]): MangaTile[] => {
    const manga: MangaTile[] = [];
    const selector = query.title ? '#content-column' : (tags[0].includes('http') ? '#content-column' : '#ul-content-pho-bien');

    for (const element of $('.commic-hover', selector).toArray()) {
        const title = $('.title-commic-tab', element).text().trim();
        const image = $('.image-commic-tab > img', element).attr('data-src') ?? "";
        const id = $('a', element).first().attr('href') ?? title;
        const subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
        manga.push(createMangaTile({
            id: id,
            image: image ?? "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }

    return manga;
};

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];

    for (const element of $('.commic-hover', '#ul-content-pho-bien').toArray()) {
        const title = $('.title-commic-tab', element).text().trim();
        const image = $('.image-commic-tab > img', element).attr('data-src') ?? "";
        const id = $('a', element).first().attr('href') ?? title;
        const subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
        manga.push(createMangaTile({
            id: id,
            image: image ?? "",
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle }),
        }));
    }

    return manga;
};

export const isLastPage = ($: CheerioStatic): boolean => {
    const currentPage = Number($("ul.pagination > li.active > span").text().trim());
    const lastPage = $("ul.pagination > li:last-child > a").text().trim();

    return currentPage >= Number(lastPage);
};

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
};