import React from 'react';
import type { QueryErrorComponent } from '../../types/autocomplete-search-props';

const QueryError: QueryErrorComponent = ({ text }) => <span>{text}</span>;

export default QueryError;
