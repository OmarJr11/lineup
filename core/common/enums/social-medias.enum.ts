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

/** Social networks that require a phone number as contact */
export const SOCIAL_NETWORKS_REQUIRING_PHONE: SocialMediasEnum[] = [
    SocialMediasEnum.WHATSAPP,
    SocialMediasEnum.TELEGRAM,
    SocialMediasEnum.PHONE,
];

/** Social networks that require a URL/profile link as contact */
export const SOCIAL_NETWORKS_REQUIRING_URL: SocialMediasEnum[] = [
    SocialMediasEnum.FACEBOOK,
    SocialMediasEnum.TWITTER,
    SocialMediasEnum.INSTAGRAM,
    SocialMediasEnum.LINKEDIN,
    SocialMediasEnum.YOUTUBE,
    SocialMediasEnum.TIKTOK,
    SocialMediasEnum.GITHUB,
    SocialMediasEnum.PINTEREST,
    SocialMediasEnum.SNAPCHAT,
    SocialMediasEnum.REDDIT,
    SocialMediasEnum.DISCORD,
];