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
    Response,
    MangaTile,
    Tag,
    // LanguageCode,
    Request,
    HomeSectionType

} from "paperback-extensions-common"

import { parseSearch, parseViewMore, isLastPage, decodeHTMLEntity, parseChapterList } from "./BaotangtruyentranhParser"

const DOMAIN = 'https://baotangtruyen3.com'
const method = 'GET'

export const BaotangtruyentranhInfo: SourceInfo = {
    version: '1.1.4',
    name: 'Baotangtruyentranh',
    icon: 'icon.png',
    author: 'AlanNois',
    authorWebsite: 'https://github.com/AlanNois/',
    description: 'Extension that pulls manga from Baotangtruyentranh',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}

export class Baotangtruyentranh extends Source {
    getMangaShareUrl(mangaId: string): string { return (`${DOMAIN}/${mangaId}`) };
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
        const url = `${DOMAIN}/${mangaId}`;
        const request = createRequestObject({
            url,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);

        const tags: Tag[] = $('.kind a').map((_, element) => {
            const genre = $(element).text().trim();
            const id = $(element).attr('href') || genre;
            return createTag({ label: decodeHTMLEntity(genre), id });
        }).get();
        const creator = decodeHTMLEntity($('.author p').last().text().trim());
        const statusFinal = $('.status p').last().text().trim().includes('Đang') ? 1 : 0;
        const desc = $("#summary").text();
        const image = $('.col-image img').attr("data-src") || "";

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [decodeHTMLEntity($('.title-detail').text().trim())],
            image: encodeURI(decodeHTMLEntity(image)),
            status: statusFinal,
            hentai: false,
            tags: [createTagSection({ label: "genres", tags, id: '0' })]
        });
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const StoryID = mangaId.split('-').pop();
        const request = createRequestObject({
            url: `${DOMAIN}/Story/ListChapterByStoryID`,
            method: "POST",
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache, must-revalidate, max-age=0'
            },
            data: { StoryID }
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);

        return parseChapterList($, mangaId);
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${DOMAIN}/${chapterId}`,
            method
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);

        const pages: string[] = $('.reading-detail img').map((_, element) => {
            const image = $(element).attr('src');
            return encodeURI(image);
        }).get();

        return createChapterDetails({
            id: chapterId,
            mangaId,
            pages,
            longStrip: false
        });
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const featured: HomeSection = createHomeSection({
            id: 'featured',
            title: "Truyện Đề Cử",
            type: HomeSectionType.featured
        });
        const newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "TRUYỆN MỚI CẬP NHẬT",
            view_more: true,
        });
        const trans: HomeSection = createHomeSection({
            id: 'trans',
            title: "TRUYỆN DỊCH",
            view_more: true,
        });

        // Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(trans);

        // Get the section data

        // New Updates
        let request = createRequestObject({
            url: `${DOMAIN}/home?page=1&typegroup=0`,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const newUpdatedItems: MangaTile[] = $('.row .item').map((_, element) => {
            const title = $('h3 > a', element).text().trim();
            const image = $('.image img', element).attr("src");
            const id = $('h3 > a', element).attr('href')?.split('/').slice(-2).join('/');
            const subtitle = $("ul .chapter > a", element).first().text().trim().replace('Chapter ', 'Ch.') + ' | ' + $("ul .chapter > i", element).first().text().trim();
            return createMangaTile({
                id: id || "",
                image: encodeURI(decodeHTMLEntity(image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
            });
        }).get();
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        // Featured
        request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        featuredItems = $('.items-slide .item').map((_, element) => {
            const title = $('.slide-caption h3', element).text().trim();
            const image = $('a img', element).attr("src");
            const id = $('a', element).attr('href')?.split('/').slice(-2).join('/');
            const subtitle = $(".slide-caption > a", element).first().text().trim() + ' | ' + $(".time", element).first().text().trim();
            return createMangaTile({
                id: id || "",
                image: encodeURI(decodeHTMLEntity(image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
            });
        }).get();
        featured.items = featuredItems;
        sectionCallback(featured);

        // Trans
        request = createRequestObject({
            url: `${DOMAIN}/home?page=1&typegroup=1`,
            method: "GET",
        });
        let transItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        transItems = $('.row .item').map((_, element) => {
            const title = $('h3 > a', element).text().trim();
            const image = $('.image img', element).attr("src");
            const id = $('h3 > a', element).attr('href')?.split('/').slice(-2).join('/');
            const subtitle = $("ul .chapter > a", element).first().text().trim().replace('Chapter ', 'Ch.') + ' | ' + $("ul .chapter > i", element).first().text().trim();
            return createMangaTile({
                id: id || "",
                image: encodeURI(decodeHTMLEntity(image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
            });
        }).get();
        trans.items = transItems;
        sectionCallback(trans);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        const page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;

        switch (homepageSectionId) {
            case "new_updated":
                url = `${DOMAIN}/home?page=${page}&typegroup=0`;
                select = 1;
                break;
            case "trans":
                url = `${DOMAIN}/home?page=${page}&typegroup=1`;
                select = 1;
                break;
            default:
                return createPagedResults({ results: [] });
        }

        const request = createRequestObject({
            url,
            method
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);
        const manga = parseViewMore($);
        const nextPage = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: manga,
            metadata: nextPage,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        const page = metadata?.page ?? 1;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const search = {
            cate: "",
            status: "-1",
            sort: "0",
        };

        tags.forEach(value => {
            const [key, val] = value.split(".");
            switch (key) {
                case 'cate':
                    search.cate = val;
                    break;
                case 'status':
                    search.status = val;
                    break;
                case 'sort':
                    search.sort = val;
                    break;
            }
        });

        const searchUrl = query.title
            ? `https://baotangtruyentranh.com/tim-truyen?keyword=${encodeURI(query.title)}&page=${page}`
            : `https://baotangtruyentranh.com/tim-truyen/${search.cate}?status=${search.status}&sort=${search.sort}&page=${page}`;
        const url = encodeURI(searchUrl);
        const request = createRequestObject({
            url,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);
        const tiles = parseSearch($);
        const nextPage = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata: nextPage
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tags: Tag[] = [];
        const tags2: Tag[] = [
            {
                id: 'status.-1',
                label: 'Tất cả'
            },
            {
                id: 'status.2',
                label: 'Hoàn thành'
            },
            {
                id: 'status.1',
                label: 'Đang tiến hành'
            }
        ];
        const tags3 = [
            {
                id: 'sort.13',
                label: 'Top ngày'
            },
            {
                id: 'sort.12',
                label: 'Top tuần'
            },
            {
                id: 'sort.11',
                label: 'Top tháng'
            },
            {
                id: 'sort.10',
                label: 'Top all'
            },
            {
                id: 'sort.20',
                label: 'Theo dõi'
            },
            {
                id: 'sort.25',
                label: 'Bình luận'
            },
            {
                id: 'sort.15',
                label: 'Truyện mới'
            },
            {
                id: 'sort.30',
                label: 'Số chapter'
            },
            {
                id: 'sort.0',
                label: 'Ngày cập nhật'
            }
        ];

        const request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);

        // Thể loại
        $('.megamenu .nav a').each((_, tag) => {
            const label = $(tag).text().trim();
            let id = 'cate.' + $(tag).attr('href').split('/').pop();
            if (label === 'Tất cả') id = 'cate.';
            if (id && label) {
                tags.push({ id, label: decodeHTMLEntity(label) });
            }
        });

        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            createTagSection({ id: '2', label: 'Tình trạng', tags: tags2.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Sắp xếp theo', tags: tags3.map(x => createTag(x)) }),
        ];

        return tagSections;
    }
}