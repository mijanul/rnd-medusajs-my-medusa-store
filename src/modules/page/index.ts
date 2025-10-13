import { Module } from "@medusajs/framework/utils";
import PageService from "./service";

export const PAGE_MODULE = "page";

export default Module(PAGE_MODULE, {
  service: PageService,
});
