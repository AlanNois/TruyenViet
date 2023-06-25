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
    // RequestHeaders,
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

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);
        const tags: Tag[] = [];
        const creator = $(".comic-intro-text span");
        const status = $(".comic-intro-text .comic-stt").text();
        const statusFinal = status.toLowerCase().includes("đang") ? 1 : 0;
        const desc = $(".text-justify p").text();

        $(".comic-info .tags > a").each((_, t) => {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') || genre;
            tags.push(createTag({ label: genre, id }));
        });

        const image = $(".img-thumbnail").attr("src") || "";

        return createManga({
            id: mangaId,
            author: creator.eq(1).text().trim(),
            artist: creator.eq(1).text().trim(),
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
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);
        const chapters: Chapter[] = [];
        const el = $("tbody td a");

        el.each((_, e) => {
            const id = $(e).attr("href").split('/').slice(-2).join('/');
            const chapNum = Number($(e).text().trim().match(/Chap.+/)?.[0].split(" ")[1]);
            const name = $($('span', e)[0]).text().trim();
            const time = $('tr > td.hidden-xs.hidden-sm', e).text().trim().split('/');
            chapters.push(createChapter({
                id,
                chapNum,
                name: decodeHTMLEntity(name),
                mangaId,
                langCode: LanguageCode.VIETNAMESE,
                time: new Date(time[1] + '/' + time[0] + '/' + time[2])
            }));
        });

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${DOMAIN}/${chapterId}`,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);
        const chapterDetails = createChapterDetails({
            id: chapterId,
            mangaId,
            pages: decryptImages($, this),
            longStrip: false
        });

        return chapterDetails;
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "Mới cập nhật",
            view_more: true,
        });
        const hot: HomeSection = createHomeSection({
            id: 'hot',
            title: "Hot nhất",
            view_more: false,
        });
        const view: HomeSection = createHomeSection({
            id: 'view',
            title: "Xem nhiều",
            view_more: false,
        });

        // Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(hot);
        sectionCallback(view);

        // Get the section data

        // New Updates
        let request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });

        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const newUpdatedItems: MangaTile[] = $('.comic-item', '.col-md-9 > .comic-list ')
            .toArray()
            .splice(0, 20)
            .map((element) => {
                const title = $('.comic-title', element).text().trim();
                const image = $('.img-thumbnail', element).attr('data-thumb') || "";
                const id = $('.comic-img > a', element).first().attr('href').split('/').slice(-2).join('/');
                const subtitle = $(`.comic-chapter`, element).text().trim();
                return createMangaTile({
                    id: id || "",
                    image: image.replace('150x150', '300x404') || "",
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                });
            });

        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        // Hot
        request = createRequestObject({
            url: `${DOMAIN}/truyen-hot-nhat/`,
            method: "GET",
        });

        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        const hotItems: MangaTile[] = $('li', '.col-md-9 .comic-list-page ul.most-views')
            .toArray()
            .map((element) => {
                const title = $('.super-title > a', element).text().trim();
                const image = $('.list-left-img', element).attr('src') || "";
                const id = $('.super-title > a', element).first().attr('href').split('/').slice(-2).join('/');
                return createMangaTile({
                    id: id || "",
                    image: image.replace('150x150', '300x404') || "",
                    title: createIconText({ text: title }),
                });
            });

        hot.items = hotItems;
        sectionCallback(hot);

        // View
        request = createRequestObject({
            url: `${DOMAIN}/nhieu-xem-nhat/`,
            method: "GET",
        });

        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        const viewItems: MangaTile[] = $('li', '.col-md-9 .comic-list-page ul.most-views')
            .toArray()
            .map((element) => {
                const title = $('.super-title > a', element).text().trim();
                const image = $('.list-left-img', element).attr('src') || "";
                const id = $('.super-title > a', element).first().attr('href').split('/').slice(-2).join('/');
                return createMangaTile({
                    id: id || "",
                    image: image.replace('150x150', '300x404') || "",
                    title: createIconText({ text: title }),
                });
            });

        view.items = viewItems;
        sectionCallback(view);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        const page: number = metadata?.page ?? 1;
        let url = '';

        switch (homepageSectionId) {
            case "new_updated":
                url = `${DOMAIN}/page/${page}/`;
                break;
            default:
                return createPagedResults({ results: [] });
        }

        const request = createRequestObject({
            url,
            method,
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);
        const manga = parseViewMore($);
        metadata = { page: page + 1 };

        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        let url = '';
        let request: any = '';
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
            });
        } else {
            url = tags[0];
            request = createRequestObject({
                url,
                method: "GET",
            });
        }

        const data = await this.requestManager.schedule(request, 1);
        let tiles: MangaTile[] = [];

        if (query.title) {
            const json = (typeof data.data) === 'string' ? JSON.parse(data.data) : data.data;
            tiles = json.data.map((el: any) => createMangaTile({
                id: el.link,
                image: el.img.replace('150x150', '300x404'),
                title: createIconText({ text: el.title }),
            }));
        } else {
            const $ = this.cheerio.load(data.data);
            tiles = parseSearch($);
        }

        return createPagedResults({
            results: tiles,
            metadata: undefined
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [];
        const url = `${DOMAIN}/so-do-trang/`;
        const request = createRequestObject({
            url,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);
        const genres = $('a', $(".tags").toArray()[0]).toArray();

        for (const genre of genres) {
            const label = $(genre).text().trim();
            const id = $(genre).attr('href');
            if (!id || !label) continue;
            tags.push({ id, label });
        }

        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
        ];

        return tagSections;
    }
}