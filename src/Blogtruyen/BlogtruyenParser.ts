import { MangaTile, SearchRequest } from "paperback-extensions-common";

const entities = require("entities");

export const generateSearch = (query: SearchRequest): string => {
    const keyword: string = query.title ?? "";
    return encodeURI(keyword);
};

export const parseSearch = ($: CheerioStatic): MangaTile[] => {
    const collectedIds: string[] = [];
    const mangas: MangaTile[] = [];
    $('p:not(:first-child)', '.list').each((_, obj) => {
        const title = $('a', obj).text().trim();
        const subtitle = 'Chương ' + $('span:nth-child(2)', obj).text().trim();
        const image = $('img', $(obj).next()).attr('src') || "";
        const id = $('a', obj).attr('href') || title;
        if (!collectedIds.includes(id)) {
            mangas.push(createMangaTile({
                id: encodeURI(id),
                image: encodeURI(image.replace('150x', '300x300')),
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: subtitle }),
            }));
            collectedIds.push(id);
        }
    });
    return mangas;
};

export const parseViewMore = ($: CheerioStatic, select: number): MangaTile[] => {
    const manga: MangaTile[] = [];
    const collectedIds: string[] = [];

    if (select === 1) {
        $('.row', '.list-mainpage .storyitem').each((_, obj) => {
            const title = $('h3.title > a', obj).text().trim();
            const subtitle = $('div:nth-child(2) > div:nth-child(4) > span:nth-child(1) > .color-red', obj).text();
            const image = $('div:nth-child(1) > a > img', obj).attr('src');
            const id = $('div:nth-child(1) > a', obj).attr('href') || title;
            if (!collectedIds.includes(id)) {
                manga.push(createMangaTile({
                    id: id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : encodeURI(image),
                    title: createIconText({ text: decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: 'Chương ' + subtitle }),
                }));
                collectedIds.push(id);
            }
        });
    } else {
        $('p:not(:first-child)', '.list').each((_, obj) => {
            const title = $('a', obj).text().trim();
            const subtitle = 'Chương ' + $('span:nth-child(2)', obj).text().trim();
            const image = $('img', $(obj).next()).attr('src') || "";
            const id = $('a', obj).attr('href') || title;
            if (!collectedIds.includes(id)) {
                manga.push(createMangaTile({
                    id: id,
                    image: encodeURI(image.replace('150x', '300x300')),
                    title: createIconText({ text: decodeHTMLEntity(title) }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
                collectedIds.push(id);
            }
        });
    }
    return manga;
};

export const isLastPage = ($: CheerioStatic): boolean => {
    const pages: number[] = [];

    $("a", "ul.pagination > li").each((_, page) => {
        const p = Number($(page).text().trim());
        if (!isNaN(p)) {
            pages.push(p);
        }
    });

    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li > select > option").find(":selected").text().split(' ')[1]);

    return currentPage >= lastPage;
};

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
};