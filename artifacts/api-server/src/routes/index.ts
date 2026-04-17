import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysisRouter from "./analysis";
import newsRouter from "./news";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysisRouter);
router.use(newsRouter);

export default router;
