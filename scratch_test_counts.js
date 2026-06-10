const { ExcelDataService } = require("./src/services/ExcelDataService");

async function main() {
  try {
    const counts = await ExcelDataService.getSummaryCounts();
    console.log("Counts from service:", counts);
  } catch (err) {
    console.error("Error running service:", err);
  }
}

main();
