import { MangaTile, SearchRequest, Chapter, LanguageCode } from "paperback-extensions-common";
import entities from "entities";

export function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export const generateSearch = (query: SearchRequest): string => {
    const keyword: string = query.title ?? "";
    return encodeURI(keyword);
}

export const parseSearch = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    $('.row .item').each((_, element) => {
        const title = $('h3 > a', element).text().trim();
        const image = $('.image img', element).attr("data-src") ?? "";
        const id = $('h3 > a', element).attr('href');
        const chapter = $("ul .chapter > a", element).first().text().trim().replace('Chapter ', 'Ch.') + ' | ' + $("ul .chapter > i", element).first().text().trim();
        manga.push(createMangaTile({
            id: id ?? "",
            image: encodeURI(decodeHTMLEntity(image)),
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: decodeHTMLEntity(chapter) }),
        }));
    });
    return manga;
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    $('.row .item').each((_, element) => {
        const title = $('h3 > a', element).text().trim();
        const image = $('.image img', element).attr("data-src") ?? "";
        const id = $('h3 > a', element).attr('href');
        const chapter = $("ul .chapter > a", element).first().text().trim().replace('Chapter ', 'Ch.') + ' | ' + $("ul .chapter > i", element).first().text().trim();
        manga.push(createMangaTile({
            id: id ?? "",
            image: encodeURI(decodeHTMLEntity(image)),
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: decodeHTMLEntity(chapter) }),
        }));
    });
    return manga;
}

export const isLastPage = ($: CheerioStatic): boolean => {
    const pages: number[] = [];
    $("li", "ul.pagination").each((_, page) => {
        const p = Number($('a', page).text().trim());
        if (!isNaN(p)) {
            pages.push(p);
        }
    });
    const lastPage = Math.max(...pages);
    const currentPage = Number($("ul.pagination > li.active > a").text().trim());
    return currentPage >= lastPage;
}

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str);
}

function convertTime(timeAgo: string): Date {
    let time: Date;
    let trimmed: number = Number((/\d*/.exec(timeAgo) ?? [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('giây')) {
        time = new Date(Date.now() - trimmed * 1000);
    } else if (timeAgo.includes('phút')) {
        time = new Date(Date.now() - trimmed * 60000);
    } else if (timeAgo.includes('giờ')) {
        time = new Date(Date.now() - trimmed * 3600000);
    } else if (timeAgo.includes('ngày')) {
        time = new Date(Date.now() - trimmed * 86400000);
    } else if (timeAgo.includes('tuần')) {
        time = new Date(Date.now() - trimmed * 86400000 * 7);
    } else if (timeAgo.includes('tháng')) {
        time = new Date(Date.now() - trimmed * 86400000 * 7 * 4);
    } else if (timeAgo.includes('năm')) {
        time = new Date(Date.now() - trimmed * 86400000 * 7 * 4 * 12);
    } else {
        if (timeAgo.includes(":")) {
            const split = timeAgo.split(' ');
            const H = split[0];
            const D = split[1];
            const fixD = D.split('/');
            const finalD = fixD[1] + '/' + fixD[0] + '/' + new Date().getFullYear();
            time = new Date(finalD + ' ' + H);
        } else {
            const split = timeAgo.split('/');
            time = new Date(split[1] + '/' + split[0] + '/' + '20' + split[2]);
        }
    }
    return time;
}

export function parseChapterList($: any, mangaId: string): Chapter[] {
    const chapters: Chapter[] = [];
    $('ul .row:not(.heading)').each((_, obj) => {
        const ids = $('a', obj).first().attr('href');
        const id = ids.replace(ids.match(/chapter-\d+/), mangaId.split('/')[mangaId.split('/').length - 1].split('-').slice(0, -1).join('-'));
        const chapNum = parseFloat($('a', obj).first().text()?.split(' ')[1]);
        let name = $('a', obj).first().text().trim();
        if ($('.coin-unlock', obj).attr('title')) {
            name = 'LOCKED (' + $('.coin-unlock', obj).attr('title') + ')';
        }
        const time = $('.col-xs-4', obj).text().trim();
        chapters.push(createChapter(<Chapter>{
            id: id.split('/').slice(-4).join('/'),
            chapNum: chapNum,
            name,
            mangaId: mangaId,
            langCode: LanguageCode.VIETNAMESE,
            time: convertTime(decodeHTMLEntity(time)),
        }));
    });
    return chapters;
}