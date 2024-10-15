const puppeteer = require('puppeteer');

let queueZonas = [];
let queueSecoes = [];
let abstencoes = [];
let resultadoSelector = 'h1 ~ div.mb-4'
let url_tse = 'https://resultados.tse.jus.br/oficial/app/index.html#/eleicao;e=e619;uf=sp;mu=70718;ufbu=sp;mubu=70718;zn=0118;se=0001;tipo=3/dados-de-urna/boletim-de-urna'

async function main() {
    console.log('Obtendo as abstenções de votos de Santos-SP das eleições 2024')

    // const browser = await puppeteer.launch({ headless: false });
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

            // obtendo as abstenções da seção
            const abstencoesSecao = await obterAbstencoes(page)

            if (abstencoesSecao) {
                logSecaoAbstencoes(abstencoesSecao)
                abstencoes = [...abstencoes, { zona, secao, abstencoes: Number(abstencoesSecao) }]
            }
            else
                logSecaoError()

            count++
        } while (queueSecoes.length > 0);
    } while (queueZonas.length > 0);

    console.log('criando arquivo abstencoes-santos-2024.csv')
    criarCSV('abstencoes-santos-2024')

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
}

async function obterAbstencoes(page) {
    try {
        await page.waitForSelector(resultadoSelector, { visible: true })
    } catch (error) {
        await page.waitForSelector(resultadoSelector, { visible: true })
    }

    return await page.$eval(resultadoSelector, div => div.innerText.split('Eleitores faltosos\n\n')[1])
}

function criarCSV(filename) {
    var fs = require('fs')

    const csv = ['Zona;Seção;Abstenções\n']
    abstencoes.forEach(({ zona, secao, abstencoes }) => {
        csv.push(`${zona};${secao};${abstencoes}\n`)
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

function logSecaoAbstencoes(totalAbstencoes) {
    process.stdout.write(`${totalAbstencoes} Abstencoes nesta seção ✔\n`);
}

function logSecaoError() {
    process.stdout.write("Não foi possivel processar as abstenções desta seção ✖\n");
}

main()
