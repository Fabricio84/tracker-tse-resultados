const puppeteer = require('puppeteer');

let queueZonas = [];
let queueSecoes = [];
let votos = [];
let resultadoSelector = 'div.box-grid';
let url_tse = 'https://resultados.tse.jus.br/oficial/app/index.html#/eleicao;e=e619;uf=sp;mu=70718;ufbu=sp;mubu=70718;tipo=3/dados-de-urna/rdv'

async function main() {
    console.log('Obtendo os votos para prefeito das Eleições Municipais de Santos SP 2024')

    const browser = await puppeteer.launch({ headless: 'new' });
    let page = await getNewPage(browser);

    queueZonas = await obterZonas(page)

    do {
        let count = 0

        const { index: zonaIndex, nome: zona } = queueZonas.shift()

        // selecionando  a zona
        logZona(zona)
        await selecionarZona(zonaIndex, page)

        // obtendo as seções
        queueSecoes = [...(await obterSecoes(page))]

        do {
            // iniciando uma nova pagina a cada 100 seções
            if (count == 99) {
                await page.close();
                page = await getNewPage(browser);
                await selecionarZona(zonaIndex, page)

                count = 0;
            }

            const { index: secaoIndex, nome: secao } = queueSecoes.shift()

            // selecionando a seção
            logSecao(secao)
            await selecionarSecao(secaoIndex, page)

            // obtendo os votos da seção
            const votosSecao = await obterVotosPrefeito(zona, secao, page)

            if (votosSecao) {
                logSecaoVotos(votosSecao.length)
                votos = [...votos, ...votosSecao]
            }
            else
                logSecaoError()
            
            count++
        } while (queueSecoes.length > 0);
    } while (queueZonas.length > 0);

    console.log('criando arquivo votos-prefeito-santos-2024.csv')
    criarCSV('votos-prefeito-santos-2024')

    console.log('concluido com sucessoS')

    await browser.close()
}

async function getNewPage(browser) {
    let page = await browser.newPage();

    const context = browser.defaultBrowserContext();
    await context.overridePermissions('https://resultados.tse.jus.br', ['geolocation']);

    await page.goto(url_tse);

    await delay(2000);

    await page.reload({ waitUntil: "domcontentloaded" });

    try {
        await page.waitForSelector('mat-form-field:nth-of-type(1) mat-select', { visible: true })
    } catch (error) {
        await page.reload({ waitUntil: "domcontentloaded" })
        await page.waitForSelector('mat-form-field:nth-of-type(1) mat-select', { visible: true })
    }

    return page
}

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

async function obterZonas(page) {
    await page.click('mat-form-field:nth-of-type(1) mat-select');

    await page.waitForSelector('mat-option', { visible: true });

    const zonas = await page.$eval('div[role=listbox]', el => el.innerText.split('\n').slice(1).map((v, i) => ({ index: i + 2, nome: v })));

    await page.click('mat-form-field:nth-of-type(1) mat-select');

    return zonas
}

async function selecionarZona(zonaIndex, page) {
    await page.click('mat-form-field:nth-of-type(1) mat-select')
    await page.waitForSelector('mat-option', { visible: true })

    await delay(1000)

    await page.click(` div[role="listbox"] mat-option:nth-child(${zonaIndex})`)

    await delay(1000)

    await page.waitForSelector('mat-form-field:nth-of-type(2) mat-select', { visible: true })
}

async function obterSecoes(page) {
    await page.click('mat-form-field:nth-of-type(2) mat-select')

    await delay(1000)

    const secoes = await page.$eval('div[role=listbox]', el => el.innerText.split('\n').slice(1).map((v, i) => ({ index: i + 2, nome: v })))

    await page.click('mat-form-field:nth-of-type(2) mat-select')

    return secoes
}

async function selecionarSecao(secaoIndex, page) {
    await page.click('mat-form-field:nth-of-type(2) mat-select')
    await page.click(`div[role="listbox"] mat-option:nth-child(${secaoIndex})`)
    await page.click('button.bg-yellow-500')

    await delay(1000)
}

async function obterVotosPrefeito(zona, secao, page) {
    let votosSecao = []
    if (await resultadoFoiRenderizado(page))
        votosSecao = [...(await extrairVotosPrefeito(zona, secao, page))]
    else {
        await page.waitForSelector('div.box-grid', { visible: true })
        if (await resultadoFoiRenderizado(page))
            votosSecao = [...(await extrairVotosPrefeito(zona, secao, page))]
        else return false
    }

    return votosSecao
}

async function resultadoFoiRenderizado(page) {
    const resultadoRenderizado = await page.$$eval(resultadoSelector, div => div[1]?.children)

    return resultadoRenderizado != undefined
}

async function extrairVotosPrefeito(zona, secao, page) {
    const votos = await page.$$eval(resultadoSelector, div => Object.values(div[1].children)
        .map(v => {
            const [voto_numero, voto_tipo] = v.innerText.split('\n\n')
            return { voto_numero, voto_tipo }
        }))
    
    return votos.map(v => ({ zona, secao, ...v }))
}

function criarCSV(filename) {
    var fs = require('fs')

    const csv = ['zona;seção;voto_tipo;voto_numero\n']
    votos.forEach(({ zona, secao, voto_tipo, voto_numero }) => {
        if (voto_numero)
            csv.push(`${zona};${secao};${voto_tipo};${voto_numero}\n`)
        else
            csv.push(`${zona};${secao};${voto_tipo}\n`)
    })

    fs.writeFile(`${__dirname}/${filename}.csv`, csv.join(''), 'utf8', function (err) {
        if (err) {
            console.log('Error ao tentar salvar o arquivo csv!');
        } else {
            console.log('Arquivo csv salvo com sucesso');
        }
    });
}

function logZona(zona) {
    console.log(zona)
}

function logSecao(secao) {
    const separador = queueSecoes.length > 0 ? '┣━' : '┗━'
    process.stdout.write(`${separador}›${secao} ⇨ `);
}

function logSecaoVotos(totalVotos) {    
    process.stdout.write(`${totalVotos} votos processados para prefeito ✔\n`);
}

function logSecaoError() {
    process.stdout.write("Não foi possivel processar os votos desta seção ✖\n");
}

main()
