"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionType = exports.ContentType = exports.AnnouncementPriority = exports.AdminRole = void 0;
var AdminRole;
(function (AdminRole) {
    AdminRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    AdminRole["ADMIN"] = "ADMIN";
    AdminRole["EDITOR"] = "EDITOR";
})(AdminRole || (exports.AdminRole = AdminRole = {}));
var AnnouncementPriority;
(function (AnnouncementPriority) {
    AnnouncementPriority["LOW"] = "LOW";
    AnnouncementPriority["MEDIUM"] = "MEDIUM";
    AnnouncementPriority["HIGH"] = "HIGH";
})(AnnouncementPriority || (exports.AnnouncementPriority = AnnouncementPriority = {}));
var ContentType;
(function (ContentType) {
    ContentType["DEVOTIONAL"] = "DEVOTIONAL";
    ContentType["VIDEO_SERMON"] = "VIDEO_SERMON";
    ContentType["AUDIO_SERMON"] = "AUDIO_SERMON";
    ContentType["ANNOUNCEMENT"] = "ANNOUNCEMENT";
})(ContentType || (exports.ContentType = ContentType = {}));
var InteractionType;
(function (InteractionType) {
    InteractionType["VIEWED"] = "VIEWED";
    InteractionType["PLAYED"] = "PLAYED";
    InteractionType["COMPLETED"] = "COMPLETED";
    InteractionType["DOWNLOADED"] = "DOWNLOADED";
    InteractionType["FAVORITED"] = "FAVORITED";
    InteractionType["SHARED"] = "SHARED";
    InteractionType["BOOKMARKED"] = "BOOKMARKED";
})(InteractionType || (exports.InteractionType = InteractionType = {}));
//# sourceMappingURL=shared.js.map