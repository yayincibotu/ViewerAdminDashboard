import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { performanceMiddleware } from "./middleware/performance";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // İç içe nesneleri desteklemesi için true yapıldı

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Schedule daily automated reviews
    initializeReviewScheduler();
  });
  
  /**
   * Initialize the daily review scheduler system
   */
  function initializeReviewScheduler() {
    // Run the scheduler immediately
    import('./review-generator.js').then(module => {
      const { scheduleRandomReviews } = module;
      
      // Run immediately
      scheduleRandomReviews()
        .then(result => {
          if (result.success) {
            log(`Review scheduler initialized: ${result.message}`);
          } else {
            log(`Failed to initialize review scheduler: ${result.error}`);
          }
        })
        .catch(error => {
          log(`Error in review scheduler: ${error.message}`);
        });
      
      // Set up a daily scheduler (every 24 hours)
      const HOURS_24 = 24 * 60 * 60 * 1000;
      setInterval(() => {
        scheduleRandomReviews()
          .then(result => {
            if (result.success) {
              log(`Daily review scheduler run: ${result.message}`);
            } else {
              log(`Failed to run daily review scheduler: ${result.error}`);
            }
          })
          .catch(error => {
            log(`Error in daily review scheduler: ${error.message}`);
          });
      }, HOURS_24);
    }).catch(error => {
      log(`Failed to load review scheduler: ${error.message}`);
    });
  }
})();
