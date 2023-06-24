import {
    Chapter,
    LanguageCode,
    Manga,
    MangaTile,
    Tag,
    TagSection,
    MangaUpdates
} from 'paperback-extensions-common'

export class Parser {

    protected convertTime(timeAgo: string): Date {
        let trimmed = Number((/\d*/.exec(timeAgo) ?? [])[0]);
        trimmed = (trimmed === 0 && timeAgo.includes('a')) ? 1 : trimmed;

        if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
            return new Date(Date.now() - trimmed * 1000);
        } else if (timeAgo.includes('phút')) {
            return new Date(Date.now() - trimmed * 60000);
        } else if (timeAgo.includes('giờ')) {
            return new Date(Date.now() - trimmed * 3600000);
        } else if (timeAgo.includes('ngày')) {
            return new Date(Date.now() - trimmed * 86400000);
        } else if (timeAgo.includes('năm')) {
            return new Date(Date.now() - trimmed * 31556952000);
        } else if (timeAgo.includes(':')) {
            const [H, D] = timeAgo.split(' ');
            const fixD = D.split('/');
            const finalD = `${fixD[1]}/${fixD[0]}/${new Date().getFullYear()}`;
            return new Date(`${finalD} ${H}`);
        } else {
            const split = timeAgo.split('/');
            return new Date(`${split[1]}/${split[0]}/20${split[2]}`);
        }
    }

    parseMangaDetails($: any, mangaId: string): Manga {
        const tags: Tag[] = [];

        $('li.kind > p.col-xs-8 > a').each((_: any, obj: any) => {
            const label = $(obj).text();
            const id = $(obj).attr('href')?.split('/')[4] ?? label;
            tags.push(createTag({ label, id }));
        });

        const creator = $('ul.list-info > li.author > p.col-xs-8').text();
        const image = 'http:' + $('div.col-image > img').attr('src');

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: $('div.detail-content > p').text(),
            titles: [$('h1.title-detail').text()],
            image: image ?? '',
            status: $('li.status > p.col-xs-8').text().toLowerCase().includes('hoàn thành') ? 0 : 1,
            rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: 'genres', tags, id: '0' })],
        });
    }


    parseChapterList($: any, mangaId: string): Chapter[] {
        const chapters: Chapter[] = [];

        $('div.list-chapter > nav > ul > li.row:not(.heading)').each((_: any, obj: any) => {
            const time = $('div.col-xs-4', obj).text();
            const group = $('div.col-xs-3', obj).text();
            const name = $('div.chapter a', obj).text();
            const chapNum = parseFloat($('div.chapter a', obj).text().split(' ')[1]);
            const timeFinal = this.convertTime(time);

            chapters.push(createChapter(<Chapter>{
                id: $('div.chapter a', obj).attr('href').split('/').slice(4, 7).join('/'),
                chapNum,
                name: name.includes(':') ? name.split('Chapter ' + chapNum + ':')[1].trim() : '',
                mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: timeFinal,
                group: `${group} lượt xem`
            }));
        });

        return chapters;
    }

    parseChapterDetails($: any): string[] {
        const pages: string[] = [];

        $('div.reading-detail > div.page-chapter > img').each((_: any, obj: any) => {
            if (!obj.attribs['data-original']) return;
            const link = obj.attribs['data-original'];
            pages.push(link.indexOf('http') === -1 ? 'http:' + link : link);
        });

        return pages;
    }

    parseSearchResults($: any): MangaTile[] {
        const tiles: MangaTile[] = [];

        $('div.item', 'div.row').each((_: any, manga: any) => {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) return;

            tiles.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : 'http:' + image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });

        return tiles;
    }

    parseTags($: any): TagSection[] {
        const tagSections: TagSection[] = [];
        const sections = [
            { selector: 'div.col-md-3.col-sm-4.col-xs-6.mrb10', idPrefix: '0', label: 'Thể Loại (Có thể chọn nhiều hơn 1)' },
            { selector: 'option', idPrefix: '1', label: 'Số Lượng Chapter (Chỉ chọn 1)', className: 'select-minchapter' },
            { selector: 'option', idPrefix: '2', label: 'Tình Trạng (Chỉ chọn 1)', className: 'select-status' },
            { selector: 'option', idPrefix: '3', label: 'Dành Cho (Chỉ chọn 1)', className: 'select-gender' },
            { selector: 'option', idPrefix: '4', label: 'Sắp xếp theo (Chỉ chọn 1)', className: 'select-sort' },
        ];

        sections.forEach(({ selector, idPrefix, label, className }) => {
            const tags: Tag[] = [];

            $(selector, `div.col-sm-10 > div.row ${className ? `.${className}` : ''}`).each((_: any, tag: any) => {
                const label = $(tag).text().trim();
                const id = `${idPrefix}.${$(tag).attr('value')}` ?? label;
                if (!id || !label) return;

                tags.push({ id, label });
            });

            tagSections.push(createTagSection({ id: idPrefix, label, tags: tags.map(x => createTag(x)) }));
        });

        return tagSections;
    }

    parseFeaturedSection($: any): MangaTile[] {
        const featuredItems: MangaTile[] = [];

        $('div.item', 'div.altcontent1').each((_: any, manga: any) => {
            const title = $('.slide-caption > h3 > a', manga).text();
            const id = $('a', manga).attr('href')?.split('/').pop();
            const image = $('a > img.lazyOwl', manga).attr('data-src');
            const subtitle = $('.slide-caption > a', manga).text().trim() + ' - ' + $('.slide-caption > .time', manga).text().trim();
            if (!id || !title) return;
            featuredItems.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : 'http:' + image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });

        return featuredItems;
    }

    parsePopularSection($: any): MangaTile[] {
        const viewestItems: MangaTile[] = [];

        $('div.item', 'div.row').slice(0, 20).each((_: any, manga: any) => {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) return;
            viewestItems.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : 'http:' + image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });

        return viewestItems;
    }

    parseHotSection($: any): MangaTile[] {
        const topWeek: MangaTile[] = [];

        $('div.item', 'div.row').slice(0, 20).each((_: any, manga: any) => {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) return;
            topWeek.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : 'http:' + image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });

        return topWeek;
    }

    parseNewUpdatedSection($: any): MangaTile[] {
        const newUpdatedItems: MangaTile[] = [];

        $('div.item', 'div.row').slice(0, 20).each((_: any, manga: any) => {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) return;
            newUpdatedItems.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : 'http:' + image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });

        return newUpdatedItems;
    }

    parseNewAddedSection($: any): MangaTile[] {
        const newAddedItems: MangaTile[] = [];

        $('div.item', 'div.row').slice(0, 20).each((_: any, manga: any) => {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) return;
            newAddedItems.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : 'http:' + image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });

        return newAddedItems;
    }

    parseFullSection($: any): MangaTile[] {
        const fullItems: MangaTile[] = [];

        $('div.item', 'div.row').slice(0, 20).each((_: any, manga: any) => {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title) return;
            fullItems.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : 'http:' + image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });

        return fullItems;
    }


    parseViewMoreItems($: any): MangaTile[] {
        const mangas: MangaTile[] = [];
        const collectedIds: Set<string> = new Set();

        $('div.item', 'div.row').each((_: any, manga: any) => {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();

            if (!id || !title) return;
            if (!collectedIds.has(id)) {
                mangas.push(createMangaTile({
                    id,
                    image: !image ? "https://i.imgur.com/GYUxEX8.png" : 'http:' + image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
                collectedIds.add(id);
            }
        });

        return mangas;
    }

    parseUpdatedManga(updateManga: any, time: Date, ids: string[]): MangaUpdates {
        const returnObject: MangaUpdates = {
            ids: []
        };

        for (const elem of updateManga) {
            if (ids.includes(elem.id) && time < this.convertTime(elem.time)) {
                returnObject.ids.push(elem.id);
            }
        }

        return returnObject;
    }

}

