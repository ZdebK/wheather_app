import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { IWeatherData } from '../types/weather.types';

/**
 * Property Entity - represents a property record in the database
 */
@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
    id: string;

  @Column({ type: 'varchar', length: 255 })
    street: string;

  @Column({ type: 'varchar', length: 100 })
    city: string;

  @Column({ type: 'varchar', length: 2 })
    state: string;

  @Column({ type: 'varchar', length: 5 })
    zipCode: string;

  @Column({ type: 'jsonb', nullable: true })
    weatherData: IWeatherData | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    long: number;

  @CreateDateColumn()
    createdAt: Date;
}
