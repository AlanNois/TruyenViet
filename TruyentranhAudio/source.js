(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlEncodeObject = exports.convertTime = exports.Source = void 0;
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    /**
     * @deprecated use {@link Source.getSearchResults getSearchResults} instead
     */
    searchRequest(query, metadata) {
        return this.getSearchResults(query, metadata);
    }
    /**
     * @deprecated use {@link Source.getSearchTags} instead
     */
    async getTags() {
        // @ts-ignore
        return this.getSearchTags?.();
    }
}
exports.Source = Source;
// Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
function convertTime(timeAgo) {
    let time;
    let trimmed = Number((/\d*/.exec(timeAgo) ?? [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('minutes')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('hours')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('days')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('year') || timeAgo.includes('years')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        time = new Date(Date.now());
    }
    return time;
}
exports.convertTime = convertTime;
/**
 * When a function requires a POST body, it always should be defined as a JsonObject
 * and then passed through this function to ensure that it's encoded properly.
 * @param obj
 */
function urlEncodeObject(obj) {
    let ret = {};
    for (const entry of Object.entries(obj)) {
        ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
    }
    return ret;
}
exports.urlEncodeObject = urlEncodeObject;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracker = void 0;
class Tracker {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
}
exports.Tracker = Tracker;

},{}],3:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./Tracker"), exports);

},{"./Source":1,"./Tracker":2}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);

},{"./base":3,"./models":47}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],6:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],7:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],8:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],9:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],10:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],11:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],12:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],13:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],14:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],15:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],16:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],17:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],18:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],19:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],20:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],21:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],22:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],23:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Button"), exports);
__exportStar(require("./Form"), exports);
__exportStar(require("./Header"), exports);
__exportStar(require("./InputField"), exports);
__exportStar(require("./Label"), exports);
__exportStar(require("./Link"), exports);
__exportStar(require("./MultilineLabel"), exports);
__exportStar(require("./NavigationButton"), exports);
__exportStar(require("./OAuthButton"), exports);
__exportStar(require("./Section"), exports);
__exportStar(require("./Select"), exports);
__exportStar(require("./Switch"), exports);
__exportStar(require("./WebViewButton"), exports);
__exportStar(require("./FormRow"), exports);
__exportStar(require("./Stepper"), exports);

},{"./Button":8,"./Form":9,"./FormRow":10,"./Header":11,"./InputField":12,"./Label":13,"./Link":14,"./MultilineLabel":15,"./NavigationButton":16,"./OAuthButton":17,"./Section":18,"./Select":19,"./Stepper":20,"./Switch":21,"./WebViewButton":22}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSectionType = void 0;
var HomeSectionType;
(function (HomeSectionType) {
    HomeSectionType["singleRowNormal"] = "singleRowNormal";
    HomeSectionType["singleRowLarge"] = "singleRowLarge";
    HomeSectionType["doubleRow"] = "doubleRow";
    HomeSectionType["featured"] = "featured";
})(HomeSectionType = exports.HomeSectionType || (exports.HomeSectionType = {}));

},{}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
    MangaStatus[MangaStatus["UNKNOWN"] = 2] = "UNKNOWN";
    MangaStatus[MangaStatus["ABANDONED"] = 3] = "ABANDONED";
    MangaStatus[MangaStatus["HIATUS"] = 4] = "HIATUS";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],27:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],28:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],29:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],30:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],31:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],32:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],33:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],34:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],35:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],36:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],37:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOperator = void 0;
var SearchOperator;
(function (SearchOperator) {
    SearchOperator["AND"] = "AND";
    SearchOperator["OR"] = "OR";
})(SearchOperator = exports.SearchOperator || (exports.SearchOperator = {}));

},{}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRating = void 0;
/**
 * A content rating to be attributed to each source.
 */
var ContentRating;
(function (ContentRating) {
    ContentRating["EVERYONE"] = "EVERYONE";
    ContentRating["MATURE"] = "MATURE";
    ContentRating["ADULT"] = "ADULT";
})(ContentRating = exports.ContentRating || (exports.ContentRating = {}));

},{}],40:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],41:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],43:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],44:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],45:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],46:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],47:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./DynamicUI"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./SourceStateManager"), exports);
__exportStar(require("./RequestInterceptor"), exports);
__exportStar(require("./TrackedManga"), exports);
__exportStar(require("./SourceManga"), exports);
__exportStar(require("./TrackedMangaChapterReadAction"), exports);
__exportStar(require("./TrackerActionQueue"), exports);
__exportStar(require("./SearchField"), exports);
__exportStar(require("./RawData"), exports);
__exportStar(require("./SearchFilter"), exports);

},{"./Chapter":5,"./ChapterDetails":6,"./Constants":7,"./DynamicUI":23,"./HomeSection":24,"./Languages":25,"./Manga":26,"./MangaTile":27,"./MangaUpdate":28,"./PagedResults":29,"./RawData":30,"./RequestHeaders":31,"./RequestInterceptor":32,"./RequestManager":33,"./RequestObject":34,"./ResponseObject":35,"./SearchField":36,"./SearchFilter":37,"./SearchRequest":38,"./SourceInfo":39,"./SourceManga":40,"./SourceStateManager":41,"./SourceTag":42,"./TagSection":43,"./TrackedManga":44,"./TrackedMangaChapterReadAction":45,"./TrackerActionQueue":46}],48:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TruyentranhAudio = exports.TruyentranhAudioInfo = exports.isLastPage = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const TruyentranhAudioParser_1 = require("./TruyentranhAudioParser");
const DOMAIN = 'https://tutientruyen.xyz/';
exports.isLastPage = ($) => {
    const current = $('ul.pagination > li.active > a').text();
    let total = $('ul.pagination > li.PagerSSCCells:last-child').text();
    if (current) {
        total = total !== null && total !== void 0 ? total : '';
        return (+total) === (+current); //+ => convert value to number
    }
    return true;
};
exports.TruyentranhAudioInfo = {
    version: '1.2.1',
    name: 'TruyentranhAudio',
    icon: 'icon.png',
    author: 'AlanNois',
    authorWebsite: 'https://github.com/AlanNois/',
    description: 'Extension that pulls manga from TruyentranhAudio.',
    websiteBaseURL: DOMAIN,
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    sourceTags: [
        {
            text: "Recommended",
            type: paperback_extensions_common_1.TagType.BLUE
        },
        {
            text: 'Notifications',
            type: paperback_extensions_common_1.TagType.GREEN
        }
    ]
};
class TruyentranhAudio extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.parser = new TruyentranhAudioParser_1.Parser();
        this.requestManager = createRequestManager({
            requestsPerSecond: 5,
            requestTimeout: 20000,
            interceptor: {
                interceptRequest: (request) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    request.headers = Object.assign(Object.assign({}, ((_a = request.headers) !== null && _a !== void 0 ? _a : {})), {
                        'referer': DOMAIN,
                    });
                    return request;
                }),
                interceptResponse: (response) => __awaiter(this, void 0, void 0, function* () {
                    return response;
                })
            }
        });
    }
    getMangaShareUrl(mangaId) { return `${DOMAIN}${mangaId}`; }
    ;
    fetchData(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: url,
                method: "GET",
            });
            const data = yield this.requestManager.schedule(request, 1);
            return this.cheerio.load(data.data);
        });
    }
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}${mangaId}`;
            const $ = yield this.fetchData(url);
            return this.parser.parseMangaDetails($, mangaId);
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}${mangaId}`;
            const $ = yield this.fetchData(url);
            return this.parser.parseChapterList($, mangaId);
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}${chapterId}`;
            const $ = yield this.fetchData(url);
            const pages = this.parser.parseChapterDetails($);
            return createChapterDetails({
                pages: pages,
                longStrip: false,
                id: chapterId,
                mangaId: mangaId,
            });
        });
    }
    getSearchResults(query, metadata) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            const search = {
                genres: '',
                gender: "-1",
                status: "-1",
                minchapter: "1",
                sort: "0"
            };
            const tags = (_c = (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.map(tag => tag.id)) !== null && _c !== void 0 ? _c : [];
            const genres = [];
            for (const value of tags) {
                if (value.indexOf('.') === -1) {
                    genres.push(value);
                }
                else {
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
            const param = encodeURI(`?keyword=${(_d = query.title) !== null && _d !== void 0 ? _d : ''}&genres=${search.genres}&gender=${search.gender}&status=${search.status}&minchapter=${search.minchapter}&sort=${search.sort}&page=${page}`);
            const $ = yield this.fetchData(url + param);
            const tiles = this.parser.parseSearchResults($);
            metadata = !exports.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: tiles,
                metadata
            });
        });
    }
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const sections = [
                createHomeSection({ id: 'featured', title: "Truyện Đề Cử", type: paperback_extensions_common_1.HomeSectionType.featured }),
                createHomeSection({ id: 'viewest', title: "Truyện Xem Nhiều Nhất", view_more: true }),
                // createHomeSection({ id: 'hot', title: "Truyện Hot Nhất", view_more: true }),
                createHomeSection({ id: 'new_updated', title: "Truyện Mới Cập Nhật", view_more: true }),
                createHomeSection({ id: 'new_added', title: "Truyện Mới Thêm Gần Đây", view_more: true }),
                createHomeSection({ id: 'full', title: "Truyện Đã Hoàn Thành", view_more: true }),
            ];
            for (const section of sections) {
                sectionCallback(section);
                let url;
                switch (section.id) {
                    case 'featured':
                        url = `${DOMAIN}`;
                        break;
                    case 'viewest':
                        url = `${DOMAIN}tim-truyen?status=-1&sort=10`;
                        break;
                    // case 'hot':
                    //     url = `${DOMAIN}hot`;
                    //     break;
                    case 'new_updated':
                        url = `${DOMAIN}`;
                        break;
                    case 'new_added':
                        url = `${DOMAIN}tim-truyen?status=-1&sort=15`;
                        break;
                    case 'full':
                        url = `${DOMAIN}tim-truyen/&status=1`;
                        break;
                    default:
                        throw new Error("Invalid homepage section ID");
                }
                const $ = yield this.fetchData(url);
                switch (section.id) {
                    case 'featured':
                        section.items = this.parser.parseFeaturedSection($, DOMAIN);
                        break;
                    case 'viewest':
                        section.items = this.parser.parsePopularSection($, DOMAIN);
                        break;
                    // case 'hot':
                    //     section.items = this.parser.parseHotSection($);
                    //     break;
                    case 'new_updated':
                        section.items = this.parser.parseNewUpdatedSection($, DOMAIN);
                        break;
                    case 'new_added':
                        section.items = this.parser.parseNewAddedSection($, DOMAIN);
                        break;
                    case 'full':
                        section.items = this.parser.parseFullSection($, DOMAIN);
                        break;
                }
                sectionCallback(section);
            }
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let param = "";
            let url = "";
            switch (homepageSectionId) {
                case "viewest":
                    param = `?status=-1&sort=10&page=${page}`;
                    url = `${DOMAIN}tim-truyen`;
                    break;
                // case "hot":
                //     param = `?page=${page}`;
                //     url = `${DOMAIN}hot`;
                //     break;
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
                    url = `${DOMAIN}tim-truyen/&status=1`;
                    break;
                default:
                    throw new Error("Requested to getViewMoreItems for a section ID which doesn't exist");
            }
            const request = createRequestObject({
                url,
                method: 'GET',
                param,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const manga = this.parser.parseViewMoreItems($);
            metadata = exports.isLastPage($) ? undefined : { page: page + 1 };
            return createPagedResults({
                results: manga,
                metadata
            });
        });
    }
    getSearchTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${DOMAIN}tim-truyen-nang-cao`;
            const $ = yield this.fetchData(url);
            return this.parser.parseTags($);
        });
    }
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateManga = [];
            const pages = 10;
            for (let i = 1; i < pages + 1; i++) {
                // const request = createRequestObject({
                //     url: DOMAIN + '?page=' + i,
                //     method: 'GET',
                // })
                // const response = await this.requestManager.schedule(request, 1)
                // const $ = this.cheerio.load(response.data);
                let url = `${DOMAIN}?page=${i}`;
                const $ = yield this.fetchData(url);
                const updateManga = $('div.item', 'div.row').toArray().map(manga => {
                    var _a;
                    const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
                    const time = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > i", manga).last().text().trim();
                    return {
                        id: id,
                        time: time
                    };
                });
                updateManga.push(...updateManga);
            }
            const returnObject = this.parser.parseUpdatedManga(updateManga, time, ids);
            mangaUpdatesFoundCallback(createMangaUpdates(returnObject));
        });
    }
}
exports.TruyentranhAudio = TruyentranhAudio;

},{"./TruyentranhAudioParser":49,"paperback-extensions-common":4}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
class Parser {
    convertTime(timeAgo) {
        var _a;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed === 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
            return new Date(Date.now() - trimmed * 1000);
        }
        else if (timeAgo.includes('phút')) {
            return new Date(Date.now() - trimmed * 60000);
        }
        else if (timeAgo.includes('giờ')) {
            return new Date(Date.now() - trimmed * 3600000);
        }
        else if (timeAgo.includes('ngày')) {
            return new Date(Date.now() - trimmed * 86400000);
        }
        else if (timeAgo.includes('năm')) {
            return new Date(Date.now() - trimmed * 31556952000);
        }
        else if (timeAgo.includes(':')) {
            const [H, D] = timeAgo.split(' ');
            const fixD = D.split('/');
            const finalD = `${fixD[1]}/${fixD[0]}/${new Date().getFullYear()}`;
            return new Date(`${finalD} ${H}`);
        }
        else {
            const split = timeAgo.split('/');
            return new Date(`${split[1]}/${split[0]}/20${split[2]}`);
        }
    }
    parseMangaDetails($, mangaId) {
        const tags = [];
        $('li.kind > p.col-xs-8 > a').each((_, obj) => {
            var _a, _b;
            const label = $(obj).text();
            const id = (_b = (_a = $(obj).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/')[4]) !== null && _b !== void 0 ? _b : label;
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
            image: image !== null && image !== void 0 ? image : '',
            status: $('li.status > p.col-xs-8').text().toLowerCase().includes('hoàn thành') ? 0 : 1,
            rating: parseFloat($('span[itemprop="ratingValue"]').text()),
            hentai: false,
            tags: [createTagSection({ label: 'genres', tags, id: '0' })],
        });
    }
    parseChapterList($, mangaId) {
        const chapters = [];
        $('div.list-chapter > nav > ul > li.row:not(.heading)').each((_, obj) => {
            const time = $('div.col-xs-4', obj).text();
            const group = $('div.col-xs-3', obj).text();
            const name = $('div.chapter a', obj).text();
            const chapNum = parseFloat($('div.chapter a', obj).text().split(' ')[1]);
            const timeFinal = this.convertTime(time);
            chapters.push(createChapter({
                id: $('div.chapter a', obj).attr('href').split('/').slice(4, 7).join('/'),
                chapNum,
                name: name.includes(':') ? name.split('Chapter ' + chapNum + ':')[1].trim() : '',
                mangaId,
                langCode: paperback_extensions_common_1.LanguageCode.VIETNAMESE,
                time: timeFinal,
                group: `${group} lượt xem`
            }));
        });
        return chapters;
    }
    parseChapterDetails($) {
        const pages = [];
        $('div.reading-detail > div.page-chapter > img').each((_, obj) => {
            if (!obj.attribs['data-original'])
                return;
            const link = obj.attribs['data-original'];
            pages.push(link.indexOf('http') === -1 ? 'http:' + link : link);
        });
        return pages;
    }
    parseSearchResults($) {
        const tiles = [];
        $('div.item', 'div.row').each((_, manga) => {
            var _a;
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                return;
            tiles.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : 'http:' + image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });
        return tiles;
    }
    parseTags($) {
        var _a, _b, _c, _d, _e;
        //id tag đéo đc trùng nhau
        const arrayTags = [];
        const arrayTags2 = [];
        const arrayTags3 = [];
        const arrayTags4 = [];
        const arrayTags5 = [];
        //The loai
        for (const tag of $('div.col-md-3.col-sm-4.col-xs-6.mrb10', 'div.col-sm-10 > div.row').toArray()) {
            const label = $('div.genre-item', tag).text().trim();
            const id = (_a = $('div.genre-item > span', tag).attr('data-id')) !== null && _a !== void 0 ? _a : label;
            if (!id || !label)
                continue;
            arrayTags.push({ id: id, label: label });
        }
        //Số lượng chapter
        for (const tag of $('option', 'select.select-minchapter').toArray()) {
            const label = $(tag).text().trim();
            const id = (_b = 'minchapter.' + $(tag).attr('value')) !== null && _b !== void 0 ? _b : label;
            if (!id || !label)
                continue;
            arrayTags2.push({ id: id, label: label });
        }
        //Tình trạng
        for (const tag of $('option', '.select-status').toArray()) {
            const label = $(tag).text().trim();
            const id = (_c = 'status.' + $(tag).attr('value')) !== null && _c !== void 0 ? _c : label;
            if (!id || !label)
                continue;
            arrayTags3.push({ id: id, label: label });
        }
        //Dành cho
        for (const tag of $('option', '.select-gender').toArray()) {
            const label = $(tag).text().trim();
            const id = (_d = 'gender.' + $(tag).attr('value')) !== null && _d !== void 0 ? _d : label;
            if (!id || !label)
                continue;
            arrayTags4.push({ id: id, label: label });
        }
        //Sắp xếp theo
        for (const tag of $('option', '.select-sort').toArray()) {
            const label = $(tag).text().trim();
            const id = (_e = 'sort.' + $(tag).attr('value')) !== null && _e !== void 0 ? _e : label;
            if (!id || !label)
                continue;
            arrayTags5.push({ id: id, label: label });
        }
        const tagSections = [createTagSection({ id: '0', label: 'Thể Loại (Có thể chọn nhiều hơn 1)', tags: arrayTags.map(x => createTag(x)) }),
            createTagSection({ id: '1', label: 'Số Lượng Chapter (Chỉ chọn 1)', tags: arrayTags2.map(x => createTag(x)) }),
            createTagSection({ id: '2', label: 'Tình Trạng (Chỉ chọn 1)', tags: arrayTags3.map(x => createTag(x)) }),
            createTagSection({ id: '3', label: 'Dành Cho (Chỉ chọn 1)', tags: arrayTags4.map(x => createTag(x)) }),
            createTagSection({ id: '4', label: 'Sắp xếp theo (Chỉ chọn 1)', tags: arrayTags5.map(x => createTag(x)) }),
        ];
        return tagSections;
    }
    parseFeaturedSection($, DOMAIN) {
        const featuredItems = [];
        $('div.item', 'div.altcontent1').each((_, manga) => {
            var _a;
            const title = $('.slide-caption > h3 > a', manga).text();
            const id = (_a = $('a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('a > img.lazyOwl', manga).attr('src');
            const subtitle = $('.slide-caption > a', manga).text().trim() + ' - ' + $('.slide-caption > .time', manga).text().trim();
            if (!id || !title)
                return;
            featuredItems.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image.includes(DOMAIN) ? image : `${DOMAIN}${image}`,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });
        return featuredItems;
    }
    parsePopularSection($, DOMAIN) {
        const viewestItems = [];
        $('div.item', 'div.row').slice(0, 20).each((_, manga) => {
            var _a;
            const title = $('figure > figcaption > h3 > a', manga).text().trim();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                return;
            viewestItems.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image.includes(DOMAIN) ? image : `${DOMAIN}${image}`,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });
        return viewestItems;
    }
    parseHotSection($) {
        const topWeek = [];
        $('div.item', 'div.row').slice(0, 20).each((_, manga) => {
            var _a;
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                return;
            topWeek.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : 'http:' + image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });
        return topWeek;
    }
    parseNewUpdatedSection($, DOMAIN) {
        const newUpdatedItems = [];
        $('div.item', 'div.row').slice(0, 20).each((_, manga) => {
            var _a;
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                return;
            newUpdatedItems.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image.includes(DOMAIN) ? image : `${DOMAIN}${image}`,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });
        return newUpdatedItems;
    }
    parseNewAddedSection($, DOMAIN) {
        const newAddedItems = [];
        $('div.item', 'div.row').slice(0, 20).each((_, manga) => {
            var _a;
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                return;
            newAddedItems.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image.includes(DOMAIN) ? image : `${DOMAIN}${image}`,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });
        return newAddedItems;
    }
    parseFullSection($, DOMAIN) {
        const fullItems = [];
        $('div.item', 'div.row').slice(0, 20).each((_, manga) => {
            var _a;
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                return;
            fullItems.push(createMangaTile({
                id,
                image: !image ? "https://i.imgur.com/GYUxEX8.png" : image.includes(DOMAIN) ? image : `${DOMAIN}${image}`,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
        });
        return fullItems;
    }
    parseViewMoreItems($) {
        const mangas = [];
        const collectedIds = new Set();
        $('div.item', 'div.row').each((_, manga) => {
            var _a;
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = (_a = $('figure.clearfix > div.image > a', manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split('/').pop();
            const image = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            const subtitle = $("figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a", manga).last().text().trim();
            if (!id || !title)
                return;
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
    parseUpdatedManga(updateManga, time, ids) {
        const returnObject = {
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
exports.Parser = Parser;

},{"paperback-extensions-common":4}]},{},[48])(48)
});
