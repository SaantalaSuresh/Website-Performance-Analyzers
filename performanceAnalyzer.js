


const puppeteer = require('puppeteer');

async function performanceAnalyzer(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    await client.send('Performance.enable');

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 }); 

    const metrics = await client.send('Performance.getMetrics');

    let firstContentfulPaint = 0;
    let largestContentfulPaint = 0;
    let firstInputDelay = 0;
    let cumulativeLayoutShift = 0;

    metrics.metrics.forEach((metric) => {
      if (metric.name === 'FirstContentfulPaint') firstContentfulPaint = metric.value;
      if (metric.name === 'LargestContentfulPaint') largestContentfulPaint = metric.value;
      if (metric.name === 'FirstInputDelay') firstInputDelay = metric.value;
      if (metric.name === 'CumulativeLayoutShift') cumulativeLayoutShift = metric.value;
    });

    const performanceTiming = JSON.parse(await page.evaluate(() => JSON.stringify(performance.timing)));

    const navigationStart = performanceTiming.navigationStart;
    const responseEnd = performanceTiming.responseEnd;
    const domContentLoadedEventEnd = performanceTiming.domContentLoadedEventEnd;
    const loadEventEnd = performanceTiming.loadEventEnd;

    const timeToFirstByte = Math.abs(responseEnd - navigationStart);
    const domContentLoaded = Math.abs(domContentLoadedEventEnd - navigationStart);
    const pageLoadTime = Math.abs(loadEventEnd - navigationStart);

    const performanceEntries = JSON.parse(await page.evaluate(() => JSON.stringify(performance.getEntriesByType('resource'))));

    const totalRequestSize = performanceEntries.reduce((total, entry) => total + (entry.transferSize || 0), 0);
    const numberOfRequests = performanceEntries.length;

    const formData = {
      timestamp: Math.abs(metrics.metrics.find(metric => metric.name === 'Timestamp')?.value || 0),
      documents: Math.abs(metrics.metrics.find(metric => metric.name === 'Documents')?.value || 0),
      frames: Math.abs(metrics.metrics.find(metric => metric.name === 'Frames')?.value || 0),
      jsEventListeners: Math.abs(metrics.metrics.find(metric => metric.name === 'JSEventListeners')?.value || 0),
      layoutObjects: Math.abs(metrics.metrics.find(metric => metric.name === 'LayoutObjects')?.value || 0),
      nodes: Math.abs(metrics.metrics.find(metric => metric.name === 'Nodes')?.value || 0),
      resources: Math.abs(metrics.metrics.find(metric => metric.name === 'Resources')?.value || 0),
      contextLifecycleStateObservers: Math.abs(metrics.metrics.find(metric => metric.name === 'ContextLifecycleStateObservers')?.value || 0),
      v8PerContextDatas: Math.abs(metrics.metrics.find(metric => metric.name === 'V8PerContextDatas')?.value || 0),
      workerGlobalScopes: Math.abs(metrics.metrics.find(metric => metric.name === 'WorkerGlobalScopes')?.value || 0),
      resourceFetchers: Math.abs(metrics.metrics.find(metric => metric.name === 'ResourceFetchers')?.value || 0),
      layoutCount: Math.abs(metrics.metrics.find(metric => metric.name === 'LayoutCount')?.value || 0),
      recalcStyleCount: Math.abs(metrics.metrics.find(metric => metric.name === 'RecalcStyleCount')?.value || 0),
      layoutDuration: Math.abs(metrics.metrics.find(metric => metric.name === 'LayoutDuration')?.value || 0),
      recalcStyleDuration: Math.abs(metrics.metrics.find(metric => metric.name === 'RecalcStyleDuration')?.value || 0),
      devToolsCommandDuration: Math.abs(metrics.metrics.find(metric => metric.name === 'DevToolsCommandDuration')?.value || 0),
      scriptDuration: Math.abs(metrics.metrics.find(metric => metric.name === 'ScriptDuration')?.value || 0),
      v8CompileDuration: Math.abs(metrics.metrics.find(metric => metric.name === 'V8CompileDuration')?.value || 0),
      taskDuration: Math.abs(metrics.metrics.find(metric => metric.name === 'TaskDuration')?.value || 0),
      taskOtherDuration: Math.abs(metrics.metrics.find(metric => metric.name === 'TaskOtherDuration')?.value || 0),
      threadTime: Math.abs(metrics.metrics.find(metric => metric.name === 'ThreadTime')?.value || 0),
      processTime: Math.abs(metrics.metrics.find(metric => metric.name === 'ProcessTime')?.value || 0),
      jsHeapUsedSize: Math.abs(metrics.metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value || 0),
      jsHeapTotalSize: Math.abs(metrics.metrics.find(metric => metric.name === 'JSHeapTotalSize')?.value || 0),
      firstMeaningfulPaint: Math.abs(metrics.metrics.find(metric => metric.name === 'FirstMeaningfulPaint')?.value || 0),
      domContentLoaded: Math.abs(domContentLoaded),
      navigationStart: Math.abs(navigationStart),
    };

    await browser.close();

    return {
      largestContentfulPaint: Math.abs(Math.round(largestContentfulPaint * 100) / 100),
      firstContentfulPaint: Math.abs(Math.round(firstContentfulPaint * 100) / 100),
      timeToFirstByte: Math.abs(Math.round(timeToFirstByte)),
      firstInputDelay: Math.abs(Math.round(firstInputDelay)),
      cumulativeLayoutShift: Math.abs(Math.round(cumulativeLayoutShift * 100) / 100),
      domContentLoaded: Math.abs(Math.round(domContentLoaded)),
      pageLoadTime: Math.abs(Math.round(pageLoadTime)),
      totalRequestSize: Math.abs(Math.round(totalRequestSize / 1024)), 
      numberOfRequests,
      formData 
    };
  } catch (error) {
    console.error('Error during performance analysis:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = performanceAnalyzer;

