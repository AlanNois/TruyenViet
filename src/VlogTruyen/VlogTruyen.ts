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
    Response,
    Request
} from "paperback-extensions-common"
import { parseSearch, parseViewMore, isLastPage } from "./VlogTruyenParser"

const method = 'GET'
const DOMAIN = 'https://vlogtruyen5.net'

export const VlogTruyenInfo: SourceInfo = {
    version: '1.1.3',
    name: 'VlogTruyen',
    icon: 'icon.png',
    author: 'AlanNois',
    authorWebsite: 'https://github.com/AlanNois/',
    description: 'Extension that pulls manga from VlogTruyen',
    websiteBaseURL: DOMAIN,
    contentRating: ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: TagType.BLUE
        }
    ]
}


export class VlogTruyen extends Source {
    getMangaShareUrl(mangaId: string): string { return `${DOMAIN}/${mangaId}` };
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

        const tags: Tag[] = $('.categories-list-detail-commic > li > a').toArray().map((t: any) => {
            const genre = $(t).text().trim();
            const id = $(t).attr('href') ?? genre;
            return createTag({ label: genre, id });
        });

        const creator = $('.top-detail-manga-content > .drawer:nth-child(5) a').text().trim();
        const status = $('.manga-status > p').text().trim().toLowerCase();
        const statusFinal = status.includes("đang") ? 1 : 0;
        const desc = $(".desc-commic-detail").text().trim();
        const image = $('.image-commic-detail img').attr('data-src') ?? "";

        return createManga({
            id: mangaId,
            author: creator,
            artist: creator,
            desc,
            titles: [$('.title-commic-detail').text().trim()],
            image,
            status: statusFinal,
            hentai: false,
            tags: [createTagSection({ label: "genres", tags, id: '0' })],
        });
    }

    async getChapters(mangaId: string): Promise<Chapter[]> {
        const request = createRequestObject({
            url: `${DOMAIN}/${mangaId}`,
            method,
        });
        const data = await this.requestManager.schedule(request, 1);
        const $1 = this.cheerio.load(data.data);
        const value = $1('input[name=manga_id]').attr('value');
        const request2 = createRequestObject({
            url: `${DOMAIN}/thong-tin-ca-nhan?manga_id=${value}`,
            headers: {
                'X-Requested-With': "XMLHttpRequest",
            },
            method,
        });
        const data2 = await this.requestManager.schedule(request2, 1);
        const $ = this.cheerio.load(JSON.parse(data2.data)['data']['chaptersHtml']);
        const chapters: Chapter[] = [];

        $('li').toArray().reverse().forEach((obj: any, i: number) => {
            const id = $('a', obj).first().attr('href').split('/').slice(3, 5).join('/');
            const chapNum = Number($('a', obj).first().attr('title')?.split(' ')[1]);
            const group = $('span.chapter-view', obj).text();
            const name = $('a', obj).first().attr('title');
            const time = $('span:nth-child(4)', obj).text().trim().split('-');

            chapters.push(createChapter({
                id,
                chapNum: isNaN(chapNum) ? i + 1 : chapNum,
                name,
                mangaId,
                group: group + " lượt xem",
                langCode: LanguageCode.VIETNAMESE,
                time: new Date(time[1] + '/' + time[0] + '/' + time[2]),
            }));
        });

        return chapters;
    }

    async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {
        const request = createRequestObject({
            url: `${DOMAIN}/${chapterId}`,
            method,
        });
        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);

        const pages: string[] = $('#aniimated-thumbnial > img').map((_: any, obj: any) => {
            const link = $(obj).attr('src') ?? "";
            return encodeURI(link);
        }).get();

        const chapterDetails = createChapterDetails({
            id: chapterId,
            mangaId,
            pages,
            longStrip: false,
        });

        return chapterDetails;
    }

    async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
        const sections: HomeSection[] = [
            createHomeSection({
                id: 'new_updated',
                title: "Mới cập nhật",
                view_more: true,
            }),
            createHomeSection({
                id: 'hot',
                title: "Đang hot",
                view_more: true,
            }),
            createHomeSection({
                id: 'view',
                title: "Xem nhiều",
                view_more: true,
            }),
        ];

        // Load empty sections
        sections.forEach((section) => sectionCallback(section));

        const sectionData = [
            { section: sections[0], url: `${DOMAIN}/the-loai/moi-cap-nhap` },
            { section: sections[1], url: `${DOMAIN}/the-loai/dang-hot` },
            { section: sections[2], url: `${DOMAIN}/de-nghi/pho-bien/xem-nhieu` },
        ];

        // Fetch section data concurrently
        await Promise.all(sectionData.map(async (data) => {
            const request = createRequestObject({
                url: data.url,
                method: "GET",
            });
            const response = await this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const items: MangaTile[] = [];

            for (const element of $('.commic-hover', '#ul-content-pho-bien').slice(0, 20).toArray()) {
                const title = $('.title-commic-tab', element).text().trim();
                const image = $('.image-commic-tab > img', element).attr('data-src') ?? "";
                const id = $('a', element).first().attr('href')?.split('/').pop() ?? "";
                const subtitle = $(`.chapter-commic-tab > a`, element).text().trim();

                items.push(createMangaTile({
                    id,
                    image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: subtitle }),
                }));
            }

            data.section.items = items;
            sectionCallback(data.section);
        }));
    }

    async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults> {
        let page: number = metadata?.page ?? 1;
        let url = '';
        let select = 1;
        switch (homepageSectionId) {
            case "new_updated":
                url = `${DOMAIN}/the-loai/moi-cap-nhap?page=${page}`;
                select = 1;
                break;
            case "hot":
                url = `${DOMAIN}/the-loai/dang-hot?page=${page}`;
                select = 2;
                break;
            case "view":
                url = `${DOMAIN}/de-nghi/pho-bien/xem-nhieu?page=${page}`;
                select = 3;
                break;
            default:
                return Promise.resolve(createPagedResults({ results: [] }));
        }

        const request = createRequestObject({
            url,
            method,
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);
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
        const search = {
            cate: '',
            translator: "",
            writer: "",
            status: "Trạng+thái",
            sort: "moi-nhat"
        };

        tags.forEach((value) => {
            const [category, option] = value.split(".");
            if (category === 'cate') search.cate = option;
            if (category === 'translator') search.translator = option;
            if (category === 'writer') search.writer = option;
            if (category === 'status') search.status = option;
            if (category === 'sort') search.sort = option;
        });

        const url = query.title
            ? encodeURI(`${DOMAIN}/tim-kiem?q=${query.title}&page=${page}`)
            : (tags[0].includes('http') ? (tags[0] + `?page=${page}`) :
                encodeURI(`${DOMAIN}/the-loai/huynh?cate=${search.cate}&translator=${search.translator}&writer=${search.writer}&status=${search.status}&sort=${search.sort}&page=${page}`));

        const request = createRequestObject({
            url,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);
        const tiles = parseSearch($, query, tags);

        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return createPagedResults({
            results: tiles,
            metadata
        });
    }

    async getSearchTags(): Promise<TagSection[]> {
        const tagSections: TagSection[] = [];
        const tags: Tag[] = [];

        const url = `${DOMAIN}/the-loai/dang-hot`;
        const request = createRequestObject({
            url,
            method: "GET",
        });

        const data = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(data.data);

        // Bảng xếp hạng
        const tags2: Tag[] = [
            { id: `${DOMAIN}/bang-xep-hang/top-tuan`, label: 'Top tuần' },
            { id: `${DOMAIN}/bang-xep-hang/top-thang`, label: 'Top tháng' },
            { id: `${DOMAIN}/bang-xep-hang/top-nam`, label: 'Top năm' }
        ];

        // Thể loại
        for (const tag of $('select[name="cate"] > option:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'cate.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags.push({ id, label });
        }
        tagSections.push(createTagSection({ id: '1', label: 'Thể Loại', tags: tags.map(x => createTag(x)) }));

        // Nhóm dịch
        const tags3: Tag[] = [];
        for (const tag of $('select[name="translator"] > option:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'translator.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags3.push({ id, label });
        }
        tagSections.push(createTagSection({ id: '2', label: 'Nhóm dịch', tags: tags3.map(x => createTag(x)) }));

        // Tác giả
        const tags4: Tag[] = [];
        for (const tag of $('select[name="writer"] > option:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'writer.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags4.push({ id, label });
        }
        tagSections.push(createTagSection({ id: '3', label: 'Tác giả', tags: tags4.map(x => createTag(x)) }));

        // Trạng thái
        const tags5: Tag[] = [];
        for (const tag of $('select[name="status"] > option:not(:first-child)').toArray()) {
            const label = $(tag).text().trim();
            const id = 'status.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags5.push({ id, label });
        }
        tagSections.push(createTagSection({ id: '4', label: 'Trạng thái', tags: tags5.map(x => createTag(x)) }));

        // Sắp xếp
        const tags6: Tag[] = [];
        for (const tag of $('select[name="sort"] > option').toArray()) {
            const label = $(tag).text().trim();
            const id = 'sort.' + $(tag).attr('value');
            if (!id || !label) continue;
            tags6.push({ id, label });
        }
        tagSections.push(createTagSection({ id: '5', label: 'Sắp xếp', tags: tags6.map(x => createTag(x)) }));

        tagSections.unshift(createTagSection({ id: '0', label: 'Bảng xếp hạng', tags: tags2.map(x => createTag(x)) }));

        return tagSections;
    }
}