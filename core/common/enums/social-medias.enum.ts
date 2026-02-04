import { registerEnumType } from "@nestjs/graphql";

export enum SocialMediasEnum {
    FACEBOOK = 'facebook',
    TWITTER = 'twitter',
    INSTAGRAM = 'instagram',
    LINKEDIN = 'linkedin',
    YOUTUBE = 'youtube',
    TIKTOK = 'tiktok',
    GITHUB = 'github',
    PINTEREST = 'pinterest',
    SNAPCHAT = 'snapchat',
    REDDIT = 'reddit',
    WHATSAPP = 'whatsapp',
    TELEGRAM = 'telegram',
    DISCORD = 'discord',
    PHONE = 'phone',
    EMAIL = 'email',
    OTHER = 'other'
}

registerEnumType(SocialMediasEnum, { name: 'SocialMediasEnum' });