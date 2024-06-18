import { SetMetadata } from '@nestjs/common';
import { SPAN_METADATA } from './trace.tokens';

export const Span = (name?: string) => SetMetadata(SPAN_METADATA, name);
