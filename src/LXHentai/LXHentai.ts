import {
    Source,
    Manga,
    Chapter,
    ChapterDetails,
    HomeSection,
    SearchRequest,
    PagedResults,
    SourceInfo,
    TagType,
    TagSection,
    ContentRating,
    RequestHeaders,
    MangaTile,
    Tag,
    LanguageCode,
    HomeSectionType,
    Request,
    Response
} from "paperback-extensions-common"

import { parseSearch, isLastPage, parseViewMore } from "./LXHentaiParser"

const DOMAIN = 'https://lxmanga.net/'
const method = 'GET'

export const LXHentaiInfo: SourceInfo = {
    version: '1.1.0',
    name: 'LXHentai',
    icon: 'icon.png',
    author: 'AlanNois',
    authorWebsite: 'https://github.com/AlanNois/',
    description: 'Extension that pulls manga from LXHentai',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.ADULT,
    sourceTags: [
        {
            text: "18+",
            type: TagType.YELLOW
        }
    ]
}

export class LXHentai extends Source {
    getMangaShareUrl(mangaId: string): string { return `${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {

                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'referer': DOMAIN
                    }
                }

                return request
            },

            interceptResponse: async (response: Response): Promise<Response> => {
                return response
            }
        }
    })

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const request = createRequestObject({
            url: `${mangaId}`,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 10);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = $('.pb-4 > div.grow > .mt-2:nth-child(3) > span > a').text().trim();
        let status = $('.pb-4 > div.grow > .mt-2:nth-child(4) > a > span').text().trim().toLowerCase().includes("đã") ? 0 : 1; //completed, 1 = Ongoing
        // let artist = '';
        let desc = $('.detail-content > p').text();
        for (const t of $('.pb-4 > div.grow > .mt-2:nth-child(2) > span > a').toArray()) {
            const genre = $(t).text().trim()
            const id = `https://lxmanga.net${$(t).attr('href') ?? genre}`
            tags.push(createTag({ label: genre, id }));
        }
        // for (const a of $('.row.mt-2 > .col-4.py-1').toArray()) {
        //     switch ($(a).text().trim()) {
        //         case "Tác giả":
        //             creator = $(a).next().text();
        //             break;
        //         case "Tình trạng":
        //             status = $(a).next().text().toLowerCase().includes("đã") ? 0 : 1;
        //             break;
        //         case "Thể loại":
        //             for (const t of $('a', $(a).next()).toArray()) {
        //                 const genre = $(t).text().trim()
        //                 const id = $(t).attr('href') ?? genre
        //                 tags.push(createTag({ label: genre, id }));
        //             }
        //             break;
        //         // case "Thực hiện":
        //         //     artist = $(a).next().text();
        //         //     break;
        //     }
        // }
        let image = $('div.relative.mx-auto.my-0 > div > div').attr('style')?.replace('background-image: ', '').replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '') ?? "";
        console.log(image);
        return createManga({
            id: mangaId,
            author: creator,
            // artist: artist,
            desc: desc,
            titles: [$('div.flex.flex-row.truncate.mb-4 > span').text()],
            image: image,
            status: status,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: true,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: mangaId,
            method,
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const chapters: Chapter[] = [];
        var i = 0;
        for (const obj of $(".overflow-y-auto.overflow-x-hidden").toArray().reverse()) {
            i++;
            let time = $('a > li > div.hidden > span.timeago', obj).text();
            chapters.push(createChapter(<Chapter>{
                id: 'https://lxmanga.net' + $('a', obj).attr('href'),
                chapNum: i,
                name: $('a > li > div > span', obj).text(),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: time
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: chapterId,
            method
        });

        const response = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(response.data);
        const pages: string[] = [];
        // const list = $('#content_chap p img').toArray().length === 0 ? $('#content_chap div:not(.text-center) img').toArray()
            // : $('#content_chap p img').toArray();
        const list = $('.max-w-7xl.mx-auto.px-3.w-full.mt-6 img').toArray()
        for (let obj of list) {
            let link = obj.attribs['src'];
            pages.push(encodeURI(link));
        }

        const chapterDetails = createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: pages,
            longStrip: false
        });
        return chapterDetails;
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        // let featured: HomeSection = createHomeSection({
        //     id: 'featured',
        //     title: "Truyện Đề Cử",
        //     type: HomeSectionType.featured
        // });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Mới cập nhật",
            view_more: true,
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Hot nhất",
            view_more: true,
        });
        sectionCallback(newUpdated);
        sectionCallback(hot);
        //New Updates
        let request = createRequestObject({
            url: 'https://lxmanga.net/tim-kiem?sort=-updated_at&filter%5Bstatus%5D=2,1',
            method: "GET",
        });
        let newUpdatedItems: MangaTile[] = [];
        let data = await this.requestManager.schedule(request, 1);
        let html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(html);
        for (let manga of $('div.w-full.relative', 'div.mt-4.grid').toArray().splice(0, 15)) {
            const title = $('a.text-ellipsis', manga).last().text().trim();
            const id = $('a.text-ellipsis', manga).last().attr('href') ?? title;
            const image = $('div.border > div > a > div > div', manga).attr('style');
            const bg = image?.replace('background-image: ', '').replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
            const sub = $('div.border > div > div > a', manga).first().text().trim();
            newUpdatedItems.push(createMangaTile({
                id: 'https://lxmanga.net' + id,
                image: bg,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //Hot
        request = createRequestObject({
            url: 'https://lxmanga.net/',
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        html = Buffer.from(createByteArray(data.rawData)).toString()
        $ = this.cheerio.load(html);
        for (let manga of $('li.glide__slide', 'ul.glide__slides').toArray().splice(0, 20)) {
            const title = $('div > div > div > div > a.text-ellipsis', manga).last().text().trim();
            const id = $('div > div > div > div > a.text-ellipsis', manga).last().attr('href') ?? title;
            const image = $('div.border > div > a > div > div', manga).attr('style');
            const bg = image?.replace('background-image: ', '').replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
            const sub = $('div > div > div > div > div > a', manga).first().text().trim();
            hotItems.push(createMangaTile({
                id: 'https://lxmanga.net' + id,
                image: bg,
                title: createIconText({
                    text: title,
                }),
                subtitleText: createIconText({
                    text: sub,
                }),
            }))
        }
        hot.items = hotItems;
        sectionCallback(hot);

        // //Featured
        // request = createRequestObject({
        //     url: 'https://lxmanga.net/',
        //     method: "GET",
        // });
        // let featuredItems: MangaTile[] = [];
        // data = await this.requestManager.schedule(request, 1);
        // html = Buffer.from(createByteArray(data.rawData)).toString()
        // $ = this.cheerio.load(html);
        // for (let manga of $('.truyenHot .gridSlide > div').toArray()) {
        //     const title = $('.slideName > a', manga).text().trim();
        //     const id = $('.slideName > a', manga).attr('href') ?? title;
        //     const image = $('.itemSlide', manga).first().css('background');
        //     const bg = image?.replace('url(', '').replace(')', '').replace(/\"/gi, "").replace(/['"]+/g, '');
        //     const sub = $('.newestChapter', manga).text().trim();
        //     featuredItems.push(createMangaTile({
        //         id: 'https://lxmanga.net' + id,
        //         image: 'https://lxmanga.net' + bg,
        //         title: createIconText({
        //             text: title,
        //         }),
        //         subtitleText: createIconText({
        //             text: sub,
        //         }),
        //     }))
        // }
        // featured.items = featuredItems;
        // sectionCallback(featured);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = '';
        let url = '';
        switch (homepageSectionId) {
            case "hot":
                url = `https://lxmanga.net/story/index.php?hot&p=${page}`;
                break;
            case "new_updated":
                url = `https://lxmanga.net/story/index.php?p=${page}`;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }))
        }

        const request = createRequestObject({
            url,
            method,
            param
        });

        const response = await this.requestManager.schedule(request, 1);
        const html = Buffer.from(createByteArray(response.rawData)).toString()
        const $ = this.cheerio.load(html);

        const manga = parseViewMore($);
        metadata = !isLastPage($) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 1;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const request = createRequestObject({
            url: query.title ? `https://lxmanga.net/story/search.php?key=${encodeURI(query.title)}&p=${page}` : `${tags[0]}&p=${page}`,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const html = Buffer.from(createByteArray(data.rawData)).toString()
        let $ = this.cheerio.load(html);
        const tiles = parseSearch($, query);

        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const url = `https://lxmanga.net/`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });

        const response = await this.requestManager.schedule(request, 1);
        const html = Buffer.from(createByteArray(response.rawData)).toString();
        const $ = this.cheerio.load(html);
        const arrayTags: Tag[] = [];
        //the loai
        for (const tag of $('.col-sm-3 a', '#showTheLoai').toArray()) {
            const label = $(tag).text().trim();
            const id = 'https://lxmanga.net' + $(tag).attr('href') ?? label;
            if (!id || !label) continue;
            arrayTags.push({ id: id, label: label });
        }

        const tagSections: TagSection[] = [
            createTagSection({ id: '0', label: 'Thể Loại', tags: arrayTags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }
}