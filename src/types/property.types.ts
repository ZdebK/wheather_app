import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

/**
 * DTO for creating a new property
 * Includes validation rules
 */
export class CreatePropertyInput {
  @IsString()
  @IsNotEmpty({ message: 'Street is required' })
  street: string;

  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  city: string;

  @IsString()
  @Length(2, 2, { message: 'State must be a 2-letter abbreviation' })
  @Matches(/^[A-Z]{2}$/, { message: 'State must be uppercase letters (e.g., AZ)' })
  state: string;

  @IsString()
  @Length(5, 5, { message: 'Zip code must be 5 digits' })
  @Matches(/^\d{5}$/, { message: 'Zip code must contain only digits' })
  zipCode: string;
}

/**
 * Filter options for querying properties
 */
export interface PropertyFilter {
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * Sort options for querying properties
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface PropertySort {
  createdAt?: SortOrder;
}
