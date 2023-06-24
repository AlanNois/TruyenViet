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
    Request,
    Response
} from "paperback-extensions-common"

import { parseSearch, parseViewMore, decryptImages, decodeHTMLEntity } from "./VcomycsParser"

const method = 'GET'
const DOMAIN = 'https://vivicomi.info'

export const VcomycsInfo: SourceInfo = {
    version: '1.1.0',
    name: 'Vcomycs',
    icon: 'icon.png',
    author: 'AlanNois',
    authorWebsite: 'https://github.com/AlanNois/',
    description: 'Extension that pulls manga from Vcomycs',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}


export class Vcomycs extends Source {
    getMangaShareUrl(mangaId: string): string { return `${DOMAIN}/truyen-tranh/${mangaId}` };
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
        const url = `${DOMAIN}/truyen-tranh/${mangaId}`;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = $(".comic-intro-text span").toArray();
        let status = $(".comic-intro-text .comic-stt").text(); //completed, 1 = Ongoing
        let statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
        let desc = $(".text-justify p").text();
        for (const t of $(".comic-info .tags > a").toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: genre, id }));
        }
        const image = $(".img-thumbnail").attr("src") ?? "";
        return createManga({
            id: mangaId,
            author: $(creator[1]).text().trim(),
            artist: $(creator[1]).text().trim(),
            desc: desc === '' ? 'Đang cập nhật…' : decodeHTMLEntity(desc),
            titles: [$(".info-title").text()],
            image: image,
            status: statusFinal,
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `${DOMAIN}/truyen-tranh/${mangaId}`,
            method,
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const chapters: Chapter[] = [];
        var el = $("tbody td a").toArray();
        for (var i in el) {
            var e = el[i];
            let id = $(e).attr("href").split('/').slice(-2).join('/');
            let chapNum = Number($(e).text().trim().match(/Chap.+/)?.[0].split(" ")[1]);
            let name = $($('span', e).toArray()[0]).text().trim();
            let time = $('tr > td.hidden-xs.hidden-sm', e).text().trim().split('/');
            chapters.push(createChapter(<Chapter>{
                id,
                chapNum: chapNum,
                name: decodeHTMLEntity(name),
                mangaId: mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: new Date(time[1] + '/' + time[0] + '/' + time[2])
            }));
        }

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${DOMAIN}/${chapterId}`,
            method
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const chapterDetails = createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: decryptImages($, this),
            longStrip: false
        });
        return chapterDetails;
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Mới cập nhật",
            view_more: true,
        });
        let hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Hot nhất",
            view_more: false,
        });
        let view: HomeSection = createHomeSection({
            id: 'view',
            title: "Xem nhiều",
            view_more: false,
        });

        //Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(hot);
        sectionCallback(view);

        ///Get the section data

        //New Updates
        let request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let newUpdatedItems: MangaTile[] = [];
        for (const element of $('.comic-item', '.col-md-9 > .comic-list ').toArray().splice(0, 20)) {
            let title = $('.comic-title', element).text().trim();
            let image = $('.img-thumbnail', element).attr('data-thumb') ?? "";
            let id = $('.comic-img > a', element).first().attr('href').split('/').slice(-2).join('/');
            let subtitle = $(`.comic-chapter`, element).text().trim();
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: image.replace('150x150', '300x404') ?? "",
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //hot
        request = createRequestObject({
            url: `${DOMAIN}/truyen-hot-nhat/`,
            method: "GET",
        });
        let hotItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('li', '.col-md-9 .comic-list-page ul.most-views').toArray()) {
            let title = $('.super-title > a', element).text().trim();
            let image = $('.list-left-img', element).attr('src') ?? "";
            let id = $('.super-title > a', element).first().attr('href').split('/').slice(-2).join('/');
            hotItems.push(createMangaTile({
                id: id ?? "",
                image: image.replace('150x150', '300x404') ?? "",
                title: createIconText({ text: title }),
            }))
        }
        hot.items = hotItems;
        sectionCallback(hot);

        //view
        request = createRequestObject({
            url: `${DOMAIN}/nhieu-xem-nhat/`,
            method: "GET",
        });
        let viewItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('li', '.col-md-9 .comic-list-page ul.most-views').toArray()) {
            let title = $('.super-title > a', element).text().trim();
            let image = $('.list-left-img', element).attr('src') ?? "";
            let id = $('.super-title > a', element).first().attr('href').split('/').slice(-2).join('/');
            // let subtitle = $(`.chapter-commic-tab > a`, element).text().trim();
            viewItems.push(createMangaTile({
                id: id ?? "",
                image: image.replace('150x150', '300x404') ?? "",
                title: createIconText({ text: title }),
                // subtitleText: createIconText({ text: subtitle }),
            }))
        }
        view.items = viewItems;
        sectionCallback(view);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        switch (homepageSectionId) {
            case "new_updated":
                url = `${DOMAIN}/page/${page}/`;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }))
        }

        const request = createRequestObject({
            url,
            method
        });

        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let manga = parseViewMore($);
        metadata = { page: page + 1 };
        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        // let page = metadata?.page ?? 1;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        var url = '';
        var request: any = '';
        if (query.title) {
            url = `${DOMAIN}/wp-admin/admin-ajax.php`;
            request = createRequestObject({
                url,
                method: 'post',
                data: {
                    "action": "searchtax",
                    "keyword": query.title
                },
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            })
        } else {
            url = tags[0];
            request = createRequestObject({
                url,
                method: "GET",
            });
        }
        let data = await this.requestManager.schedule(request, 1);
        var tiles: any = [];
        if (query.title) {
            const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            let listItems: MangaTile[] = [];
            for (const el of json.data) {
                listItems.push(createMangaTile({
                    id: el.link,
                    image: el.img.replace('150x150', '300x404'),
                    title: createIconText({ text: el.title }),
                    // subtitleText: createIconText({ text: subtitle }),
                }));
            }
            tiles = listItems;
        } else {
            let $ = this.cheerio.load(data.data);
            tiles = parseSearch($);
        }

        metadata = undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [];
        const url = `${DOMAIN}/so-do-trang/`
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        var genres = $('a', $(".tags").toArray()[0]).toArray()
        //the loai
        for (var i in genres) {
            var genre = genres[i]
            const label = $(genre).text().trim();
            const id = $(genre).attr('href');
            if (!id || !label) continue;
            tags.push({ id: id, label: label });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
        ]
        return tagSections;
    }
}