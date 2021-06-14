export const URL_WIKI_PERSONALDATA_IO = 'wiki.personaldata.io';
export const URL_PERSONALDATA_IO = 'query.personaldata.io/proxy/wdqs/bigdata/namespace/wdq/';
export const vocabulary = {
    items: {
        onlineDatingApplication: 'pdio:Q5066',
    },
    properties: {
        instanceOf: 'pdiot:P3',
        country: 'pdiot:P55',
        email: 'pdiot:P17',
        collects: "pdiot:P10",
        requires: "pdiot:P122",
    }
};

// sorry for the dumb enum
export const templates = {
    MailtoAccess: 'MailtoAccess',
    MailtoSwissAccess: 'MailtoSwissAccess',
    Access: 'Access',
    SwissAccess: 'SwissAccess',
    Mailto: 'Mailto'
};

const t = templates;
const {items: i, properties: p} = vocabulary;

export const SPARQL_DATING_APPS_WITH_EMAIL =
`SELECT ?item ?itemLabel ?mail WHERE {
  ?item ${p.instanceOf} ${i.onlineDatingApplication}.
  ?item ${p.email} ?mail.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} `;

export async function query(sparqlQuery, apiUrl) {
    const response = await fetch(
        `https://${apiUrl}?origin=*&query=${encodeURIComponent(sparqlQuery)}`,
        { "headers": { "Accept": "application/sparql-results+json" } }
    );
    return await response.json();
}

export async function expandTemplate(itemId, templateName, wikiUrl) {
    let formData = new URLSearchParams();
    formData.append('action', 'expandtemplates');
    formData.append('text', `{{${templateName}|${itemId}}}`);
    formData.append('format', `json`);
    formData.append('prop', `wikitext`);
    formData.append('origin', `*`);
    const response = await fetch(`https://${wikiUrl}/w/api.php`,
                                 { body: formData, method: 'post'});
    const data = await response.json();
    return data.expandtemplates.wikitext;
}

export function bindingsAsKeyVals(result){
    const {head: {vars}, results: {bindings}} = result;
    return bindings.map(binding => {
        return vars.reduce((keyVals, v) =>{
            if(binding[v]){
                keyVals[v] = binding[v].value;
            }
            return keyVals;
        }, {} )
    })
};

export async function fetchDatingApps(){
    const data = await query(SPARQL_DATING_APPS_WITH_EMAIL,
        URL_PERSONALDATA_IO);
    return bindingsAsKeyVals(data);
}

export async function fetchMailTo(item, isSwiss){
    const entityId = item.split('/').pop();
    const template = isSwiss ? t.MailtoSwissAccess : t.MailtoAccess;
    const mailTo = await expandTemplate(entityId, template,
                                URL_WIKI_PERSONALDATA_IO);
    const url = new URL(mailTo);
    const href = url.href;
    const recipient = url.pathname;
    const body = url.searchParams.get('body');
    const subject = url.searchParams.get('subject');
    return {recipient, body, subject, href};
}
