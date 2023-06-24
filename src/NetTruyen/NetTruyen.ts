import {
    Chapter,
    ChapterDetails, HomeSection,
    Manga,
    PagedResults,
    Response,
    Request,
    SearchRequest,
    Source,
    SourceInfo,
    TagType,
    TagSection,
    HomeSectionType,
    ContentRating,
    MangaUpdates
} from "paperback-extensions-common"
import { Parser } from './NetTruyenParser';

const DOMAIN = 'http://www.nettruyenmax.com/'

export const isLastPage = ($: CheerioStatic): boolean => {
    const current = $('ul.pagination > li.active > a').text();
    let total = $('ul.pagination > li.PagerSSCCells:last-child').text();

    if (current) {
        total = total ?? '';
        return (+total) === (+current); //+ => convert value to number
    }
    return true;
}

export const NetTruyenInfo: SourceInfo = {
    version: '1.1.1',
    name: 'NetTruyen',
    icon: 'icon.png',
    author: 'AlanNois',
    authorWebsite: 'https://github.com/AlanNois/',
    description: 'Extension that pulls manga from NetTruyen.',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        },
        {
            text: 'Notifications',
            type: TagType.GREEN
        }
    ]
}

export class NetTruyen extends Source {
    parser = new Parser();
    getMangaShareUrl(mangaId: string): string { return `${DOMAIN}truyen-tranh/${mangaId}` };
    requestManager = createRequestManager({
        requestsPerSecond: 5,
        requestTimeout: 20000,
        interceptor: {
            interceptRequest: async (request: Request): Promise<Request> => {

                request.headers = {
                    ...(request.headers ?? {}),
                    ...{
                        'referer': DOMAIN,
                    }
                }

                return request
            },

            interceptResponse: async (response: Response): Promise<Response> => {
                return response
            }
        }
    })

    private async fetchData(url: string): Promise<CheerioStatic> {
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        const data = await this.requestManager.schedule(request, 1);
        return this.cheerio.load(data.data);
    }

    async getMangaDetails(mangaId: string): Promise<Manga> {
        const url = `${DOMAIN}truyen-tranh/${mangaId}`;
        const $ = await this.fetchData(url);
        return this.parser.parseMangaDetails($, mangaId);
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const url = `${DOMAIN}truyen-tranh/${mangaId}`;
        const $ = await this.fetchData(url);
        return this.parser.parseChapterList($, mangaId);
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const url = `${DOMAIN}truyen-tranh/${chapterId}`;
        const $ = await this.fetchData(url);
        const pages = this.parser.parseChapterDetails($);
        return createChapterDetails({
            pages: pages,
            longStrip: false,
            id: chapterId,
            mangaId: mangaId,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 1;

        const search = {
            genres: '',
            gender: "-1",
            status: "-1",
            minchapter: "1",
            sort: "0"
        };

        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const genres: string[] = [];
        for (const value of tags) {
            if (value.indexOf('.') === -1) {
                genres.push(value);
            } else {
                const [key, val] = value.split(".");
                switch (key) {
                    case 'minchapter':
                        search.minchapter = val;
                        break;
                    case 'gender':
                        search.gender = val;
                        break;
                    case 'sort':
                        search.sort = val;
                        break;
                    case 'status':
                        search.status = val;
                        break;
                }
            }
        }
        search.genres = genres.join(",");

        const url = `${DOMAIN}${query.title ? '/tim-truyen' : '/tim-truyen-nang-cao'}`;
        const param = encodeURI(`?keyword=${query.title ?? ''}&genres=${search.genres}&gender=${search.gender}&status=${search.status}&minchapter=${search.minchapter}&sort=${search.sort}&page=${page}`);
        const $ = await this.fetchData(url + param);
        const tiles = this.parser.parseSearchResults($);
        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const sections: HomeSection[] = [
            createHomeSection({ id: 'featured', title: "Truyện Đề Cử", type: HomeSectionType.featured }),
            createHomeSection({ id: 'viewest', title: "Truyện Xem Nhiều Nhất", view_more: true }),
            createHomeSection({ id: 'hot', title: "Truyện Hot Nhất", view_more: true }),
            createHomeSection({ id: 'new_updated', title: "Truyện Mới Cập Nhật", view_more: true }),
            createHomeSection({ id: 'new_added', title: "Truyện Mới Thêm Gần Đây", view_more: true }),
            createHomeSection({ id: 'full', title: "Truyện Đã Hoàn Thành", view_more: true }),
        ];

        for (const section of sections) {
            sectionCallback(section);
            let url: string;
            switch (section.id) {
                case 'featured':
                    url = `${DOMAIN}`;
                    break;
                case 'viewest':
                    url = `${DOMAIN}tim-truyen?status=-1&sort=10`;
                    break;
                case 'hot':
                    url = `${DOMAIN}hot`;
                    break;
                case 'new_updated':
                    url = `${DOMAIN}`;
                    break;
                case 'new_added':
                    url = `${DOMAIN}tim-truyen?status=-1&sort=15`;
                    break;
                case 'full':
                    url = `${DOMAIN}truyen-full`;
                    break;
                default:
                    throw new Error("Invalid homepage section ID");
            }

            const $ = await this.fetchData(url);
            switch (section.id) {
                case 'featured':
                    section.items = this.parser.parseFeaturedSection($);
                    break;
                case 'viewest':
                    section.items = this.parser.parsePopularSection($);
                    break;
                case 'hot':
                    section.items = this.parser.parseHotSection($);
                    break;
                case 'new_updated':
                    section.items = this.parser.parseNewUpdatedSection($);
                    break;
                case 'new_added':
                    section.items = this.parser.parseNewAddedSection($);
                    break;
                case 'full':
                    section.items = this.parser.parseFullSection($);
                    break;
            }
            sectionCallback(section);
        }
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let param = "";
        let url = "";

        switch (homepageSectionId) {
            case "viewest":
                param = `?status=-1&sort=10&page=${page}`;
                url = `${DOMAIN}tim-truyen`;
                break;
            case "hot":
                param = `?page=${page}`;
                url = `${DOMAIN}hot`;
                break;
            case "new_updated":
                param = `?page=${page}`;
                url = DOMAIN;
                break;
            case "new_added":
                param = `?status=-1&sort=15&page=${page}`;
                url = `${DOMAIN}tim-truyen`;
                break;
            case "full":
                param = `?page=${page}`;
                url = `${DOMAIN}truyen-full`;
                break;
            default:
                throw new Error("Requested to getViewMoreItems for a section ID which doesn't exist");
        }

        const request = createRequestObject({
            url,
            method: 'GET',
            param,
        });

        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);

        const manga = this.parser.parseViewMoreItems($);
        metadata = isLastPage($) ? undefined : { page: page + 1 };

        return createPagedResults({
            results: manga,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const url = `${DOMAIN}tim-truyen-nang-cao`;
        const $ = await this.fetchData(url);
        return this.parser.parseTags($);
    }

    override async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        const updateManga: any = [];
        const pages = 10;
        for (let i = 1; i < pages + 1; i++) {
            // const request = createRequestObject({
            //     url: DOMAIN + '?page=' + i,
            //     method: 'GET',
            // })
            // const response = await this.requestManager.schedule(request, 1)
            // const $ = this.cheerio.load(response.data);
            let url = `${DOMAIN}?page=${i}`
            const $ = await this.fetchData(url);
            const updateManga = $('div.item', 'div.row').toArray().map(manga => {
                const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop();
                const time = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > i", manga).last().text().trim();
                return {
                    id: id,
                    time: time
                };
            });

            updateManga.push(...updateManga);

        }

        const returnObject = this.parser.parseUpdatedManga(updateManga, time, ids)
        mangaUpdatesFoundCallback(createMangaUpdates(returnObject))
    }
}