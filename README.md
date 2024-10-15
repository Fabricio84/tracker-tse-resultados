---

# TSE Election Results Scraper

This project is a web scraping tool built with **Node.js** and **Puppeteer** that fetches voting results and abstentions from the official [TSE Election Results website](https://resultados.tse.jus.br/). The scraper allows users to select election data based on location and type of results (votes or abstentions) and generates a CSV file for further analysis.

## Features
- **Simple Setup**: Just clone the repository, configure a few variables, and you're ready to go.
- **Automated Data Fetching**: Automatically fetch data on votes or abstentions from Brazilian elections, directly from the TSE website.
- **CSV Export**: Results are stored in easy-to-use CSV files for further analysis or reporting.

## How It Works
1. Access the TSE election results website and select the desired election, state, and city.
2. Copy the resulting URL.
3. Replace the value of the `url_tse` variable in the `fetch-votos.js` or `fetch-abstencoes.js` files with the copied URL.
4. Run the command to scrape the data, either for voting results or abstentions.
5. The scraper will generate a CSV file containing the desired data.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Fabricio84/tracker-tse-resultados.git
   cd tracker-tse-resultados
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

## Usage

1. Open the [TSE Election Results website](https://resultados.tse.jus.br/) and select the desired election, state, and city.
2. Copy the URL of the selected results.
3. Update the `url_tse` variable in the following files:
   - **For voting results**: `fetch-votos.js`
   - **For abstention data**: `fetch-abstencoes.js`

4. Run the scraper:
   - For **voting results**, use the following command:
     ```bash
     npm run get-votos
     ```
   - For **abstentions**, use the following command:
     ```bash
     npm run get-abstencoes
     ```

5. After running the command, a CSV file containing the scraped data will be generated in the project folder.

## Output
The output will be a CSV file, which contains the election data from the specified location, ready for analysis or integration into your workflow.

## Technologies Used
- **Node.js**
- **Puppeteer**
- **CSV file generation**

## Why This Project?
This project showcases my ability to work with web scraping, automation, and data extraction using **Node.js** and **Puppeteer**. It demonstrates my skills in:
- Handling large-scale data from structured websites.
- Building automation tools.
- Creating user-friendly scripts for real-world applications.

## Getting in Touch
If you're interested in my work or would like to discuss potential opportunities, feel free to contact me via [LinkedIn](https://www.linkedin.com/in/fabricio-souza-8623a667/) or [email](mailto:fabricio.abner@gmail.com).

---

Esse README destaca não apenas as funcionalidades do projeto, mas também suas habilidades como desenvolvedor, tornando-o mais atrativo para recrutadores.