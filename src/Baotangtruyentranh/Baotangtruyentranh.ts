import { test } from "mocha"
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

const DOMAIN = 'https://baotangtruyengo.com/'
const method = 'GET'

export const BaotangtruyentranhInfo: SourceInfo = {
    version: '1.0.3',
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
        },
        {
            text: "Cloudflare",
            type: TagType.RED
        }
    ]
}

export class Baotangtruyentranh extends Source {
    getMangaShareUrl(mangaId: string): string { return (mangaId) };
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
        const url = mangaId;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let tags: Tag[] = [];
        let creator = decodeHTMLEntity($('.author p').last().text().trim());
        let statusFinal = $('.status p').last().text().trim().includes('Đang') ? 1 : 0;
        for (const t of $('a', '.kind').toArray()) {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            tags.push(createTag({ label: decodeHTMLEntity(genre), id }));
        }

        let desc = $("#summary").text();
        let image = $('.col-image img').attr("data-src") ?? "";

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc: desc,
            titles: [decodeHTMLEntity($('.title-detail').text().trim())],
            image: encodeURI(decodeHTMLEntity(image)),
            status: statusFinal,
            // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: "genres", tags: tags, id: '0' })]
        });

    }
    async getChapters(mangaId: string): Promise<Chapter[]> {
        let StoryID = mangaId.split('-').pop();
        const request2 = createRequestObject({
            url: 'https://baotangtruyengo.com/Story/ListChapterByStoryID',
            method: "POST",
            headers: {
                authority: 'baotangtruyengo.com',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                referer: mangaId,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
                'x-requested-with': 'XMLHttpRequest',
                cookie: 'cf_zaraz_google-analytics_v4_a9ec=true; google-analytics_v4_a9ec__ga4sid=1270034858; google-analytics_v4_a9ec__session_counter=1; google-analytics_v4_a9ec__ga4=89235605-67f8-4a5b-a185-c1af25aac63d; google-analytics_v4_a9ec___z_ga_audiences=89235605-67f8-4a5b-a185-c1af25aac63d; __RequestVerificationToken=qtuuVs0Zbxndw6tJqXqCLjz1pcZSjgmNo6j7DkU51KIiXVtg_bVQ3zpUuSaxTh5W87zDG7--QGguu8b2SmXjAgWNbIaeJhbEr_bCPmD2avU1; Guid=7d04bc3b-4ea3-4a0e-9b3e-18c828e82874; google-analytics_v4_a9ec__engagementPaused=1678200645737; google-analytics_v4_a9ec__engagementStart=1678200647548; google-analytics_v4_a9ec__counter=12; google-analytics_v4_a9ec__let=1678200647548'
              },
            data: {StoryID: StoryID}
        });
        let data2 = await this.requestManager.schedule(request2, 1);
        let $2 = this.cheerio.load(data2.data);
   
        const chapters = parseChapterList($2, mangaId);
        console.log(chapters)
        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${chapterId}`,
            method
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const pages: string[] = [];
        for (let obj of $('.reading-detail img').toArray()) {
            let image = $(obj).attr('src');
            pages.push(encodeURI(image));
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
        let featured: HomeSection = createHomeSection({
            id: 'featured',
            title: "Truyện Đề Cử",
            type: HomeSectionType.featured
        });
        let newUpdated: HomeSection = createHomeSection({
            id: 'new_updated',
            title: "TRUYỆN MỚI CẬP NHẬT",
            view_more: true,
        });
        let trans: HomeSection = createHomeSection({
            id: 'trans',
            title: "TRUYỆN DỊCH",
            view_more: true,
        });

        //Load empty sections
        sectionCallback(newUpdated);
        sectionCallback(trans);

        ///Get the section dat

        //New Updates
        let request = createRequestObject({
            url: 'https://baotangtruyengo.com/home?page=1&typegroup=0',
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        let newUpdatedItems: MangaTile[] = [];
        for (const element of $('.row .item').toArray()) {
            let title = $('h3 > a', element).text().trim();
            let image = $('.image img', element).attr("src");
            let id = $('h3 > a', element).attr('href');
            let subtitle = $("ul .chapter > a", element).first().text().trim().replace('Chapter ', 'Ch.') + ' | ' + $("ul .chapter > i", element).first().text().trim();
            newUpdatedItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(decodeHTMLEntity(image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
            }))
        }
        newUpdated.items = newUpdatedItems;
        sectionCallback(newUpdated);

        //featured
        request = createRequestObject({
            url: DOMAIN,
            method: "GET",
        });
        let featuredItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.items-slide .item').toArray()) {
            let title = $('.slide-caption h3', element).text().trim();
            let image = $('a img', element).attr("src");
            let id = $('a', element).attr('href');
            let subtitle = $(".slide-caption > a", element).first().text().trim() + ' | ' + $(".time", element).first().text().trim();
            featuredItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(decodeHTMLEntity(image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
            }))
        }
        featured.items = featuredItems;
        sectionCallback(featured);

        //trans
        request = createRequestObject({
            url: 'https://baotangtruyengo.com/home?page=1&typegroup=1',
            method: "GET",
        });
        let transItems: MangaTile[] = [];
        data = await this.requestManager.schedule(request, 1);
        $ = this.cheerio.load(data.data);
        for (const element of $('.row .item').toArray()) {
            let title = $('h3 > a', element).text().trim();
            let image = $('.image img', element).attr("src");
            let id = $('h3 > a', element).attr('href');
            let subtitle = $("ul .chapter > a", element).first().text().trim().replace('Chapter ', 'Ch.') + ' | ' + $("ul .chapter > i", element).first().text().trim();
            transItems.push(createMangaTile({
                id: id ?? "",
                image: encodeURI(decodeHTMLEntity(image)),
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) }),
            }))
        }
        trans.items = transItems;
        sectionCallback(trans);
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "new_updated":
                url = `https://baotangtruyengo.com/home?page=${page}&typegroup=0`;
                select = 1;
                break;
            case "trans":
                url = `https://baotangtruyengo.com/home?page=${page}&typegroup=1`;
                select = 1;
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
        metadata = !isLastPage($) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata,
        });
    }

    async getSearchResults(query: SearchRequest, metadata: any): Promise<PagedResults> {
        let page = metadata?.page ?? 1;
        const tags = query.includedTags?.map(tag => tag.id) ?? [];
        const search = {
            cate: "",
            status: "-1",
            sort: "0",
        };
        tags.map((value) => {
            switch (value.split(".")[0]) {
                case 'cate':
                    search.cate = (value.split(".")[1]);
                    break
                case 'status':
                    search.status = (value.split(".")[1]);
                    break
                case 'sort':
                    search.sort = (value.split(".")[1]);
                    break
            }
        })
        const request = createRequestObject({
            url: query.title ? encodeURI(`https://baotangtruyengo.com/tim-truyen?keyword=${query.title}&page=${page}`)
                : encodeURI(`https://baotangtruyengo.com/tim-truyen/${search.cate}?status=${search.status}&sort=${search.sort}&page=${page}`),
            method: "GET",
        });

        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        const tiles = parseSearch($);

        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
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
        ]

        const url = DOMAIN;
        const request = createRequestObject({
            url: url,
            method: "GET",
        });
        let data = await this.requestManager.schedule(request, 1);
        let $ = this.cheerio.load(data.data);
        //the loai
        for (const tag of $('.megamenu .nav a').toArray()) {
            let label = $(tag).text().trim();
            let id = 'cate.' + $(tag).attr('href').split('/').pop();
            if (label === 'Tất cả') id = 'cate.';
            if (!id || !label) continue;
            tags.push({ id: id, label: decodeHTMLEntity(label) });
        }
        const tagSections: TagSection[] = [
            createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }),
            createTagSection({ id: '2', label: 'Tình trạng', tags: tags2.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Sắp xếp theo', tags: tags3.map(x => createTag(x)) }),

        ]
        return tagSections;
    }
}