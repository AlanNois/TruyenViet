import { Tag, MangaTile, SearchRequest, TagSection } from "paperback-extensions-common";

// const entities = require("entities"); //Import package for decoding HTML entities

export interface UpdatedManga {
    ids: string[];
    loadMore: boolean;
}

export const generateSearch = (query: SearchRequest): string => {
    let keyword: string = query.title ?? "";
    return encodeURI(keyword);
}

export const parseSearch = ($: CheerioStatic, query: any): MangaTile[] => {
    const manga: MangaTile[] = [];
    // const collectedIds: string[] = [];
    for (let obj of $('div.w-full.relative', 'div.mt-4.grid').toArray()) {
        const title = $('a.text-ellipsis', obj).last().text().trim();
        const id = $('a.text-ellipsis', obj).last().attr('href') ?? title;
        const image = $('div.border > div > a > div > div', obj).attr('style');
        const bg = image?.replace('background-image: ', '').replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
        const sub = $('div.border > div > div > a', obj).first().text().trim();
        // if (!id || !subtitle) continue;
        manga.push(createMangaTile({
            id: 'https://lxhentai.com' + id,
            image: 'https://lxhentai.com' + bg,
            title: createIconText({
                text: title,
            }),
            subtitleText: createIconText({
                text: sub,
            }),
        }))
    }
    return manga; //cái này trả về rỗng thì ko cộng dồn nữa
}

export const parseViewMore = ($: CheerioStatic): MangaTile[] => {
    const manga: MangaTile[] = [];
    // const collectedIds: string[] = [];
    for (let obj of $('div.w-full.relative', 'div.mt-4.grid').toArray()) {
        const title = $('a.text-ellipsis', obj).last().text().trim();
        const id = $('a.text-ellipsis', obj).last().attr('href') ?? title;
        const image = $('div.border > div > a > div > div', obj).attr('style');
        const bg = image?.replace('background-image: ', '').replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
        const sub = $('div.border > div > div > a', obj).first().text().trim();
        // if (!id || !subtitle) continue;
        manga.push(createMangaTile({
            id: 'https://lxhentai.com' + id,
            image: 'https://lxhentai.com' + bg,
            title: createIconText({
                text: title,
            }),
            subtitleText: createIconText({
                text: sub,
            }),
        }))
    }
    return manga; //cái này trả về rỗng thì ko cộng dồn nữa
}

export const parseTags = ($: CheerioStatic): TagSection[] => {
    const arrayTags: Tag[] = [];
    for (const obj of $("li", "ul").toArray()) {
        const label = ($("a", obj).text().trim());
        const id = $('a', obj).attr('href') ?? "";
        if (id == "") continue;
        arrayTags.push({
            id: id,
            label: label,
        });
    }
    const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) })];
    return tagSections;
}

export const isLastPage = ($: CheerioStatic): boolean => {
    let isLast = false;
    const pages = [];

    for (const page of $("li", "ul.pagination").toArray()) {
        const p = Number($('a', page).text().trim());
        if (isNaN(p)) continue;
        pages.push(p);
    }
    const lastPage = Math.max(...pages);
    const currentPage = Number($("li.active > a").text().trim());
    if (currentPage >= lastPage) isLast = true;
    return isLast;
}

export function convertTime(timeAgo: string): Date {
    let time: Date
    let trimmed: number = Number((/\d*/.exec(timeAgo) ?? [])[0])
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed
    if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
        time = new Date(Date.now() - trimmed * 1000) // => mili giây (1000 ms = 1s)
    } else if (timeAgo.includes('phút')) {
        time = new Date(Date.now() - trimmed * 60000)
    } else if (timeAgo.includes('giờ')) {
        time = new Date(Date.now() - trimmed * 3600000)
    } else if (timeAgo.includes('ngày')) {
        time = new Date(Date.now() - trimmed * 86400000)
    } else if (timeAgo.includes('ngày')) {
        time = new Date(Date.now() - trimmed * 86400000)
    } else if (timeAgo.includes('năm')) {
        time = new Date(Date.now() - trimmed * 31556952000)
    } else {
        if (timeAgo.includes(":")) {
            let split = timeAgo.split(' ');
            let H = split[0]; //vd => 21:08
            let D = split[1]; //vd => 25/08 
            let fixD = D.split('/');
            let finalD = fixD[1] + '/' + fixD[0] + '/' + new Date().getFullYear();
            time = new Date(finalD + ' ' + H);
        } else {
            let split = timeAgo.split('/'); //vd => 05/12/18
            time = new Date(split[1] + '/' + split[0] + '/' + '20' + split[2]);
        }
    }
    return time
}