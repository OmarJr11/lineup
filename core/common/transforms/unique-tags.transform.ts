import _ = require('lodash');

export function UniqueTags(tags: any): any {
    const uniqueTags = _.uniq(tags.value);

    if (uniqueTags.length === 0) {
        return null;
    }

    return uniqueTags;
}
