import {
    Check,
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { Business, SocialNetwork } from '.';

@Check(
    'CHK_social_network_business_url_or_phone',
    `("url" IS NOT NULL AND "url" <> '') OR ("phone" IS NOT NULL AND "phone" <> '')`
)
@Index('IDX_unique_active_social_network_business', ['idCreationBusiness', 'idSocialNetwork'], {
    unique: true,
    where: "status != 'deleted'"
})
@Entity({ name: 'social_network_businesses' })
export class SocialNetworkBusiness extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_social_network' })
    idSocialNetwork: number;

    @Column({ type: 'text', nullable: true })
    url?: string;

    @Column({ type: 'text', nullable: true })
    phone?: string;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => SocialNetwork, (socialNetwork) => socialNetwork.socialNetworkBusinesses)
    @JoinColumn([{ name: 'id_social_network', referencedColumnName: 'id' }])
    socialNetwork?: SocialNetwork;

    @ManyToOne(() => Business, (business) => business.socialNetworkBusinesses)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    business?: Business;

    @ManyToOne(() => Business, (business) => business.modifiedSocialNetworkBusinesses)
    @JoinColumn([{ name: 'modification_business', referencedColumnName: 'id' }])
    modificationBusiness?: Business;
}
