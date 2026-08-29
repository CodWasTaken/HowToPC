import type { ReferenceProduct } from "@howtopc/catalog";
import { fetchCatalogProduct } from "./catalog-client";
import {
  addProductToSession,
  createBuilderSession,
  type BuilderSession,
} from "./builder-session";

export interface BuilderTemplate {
  id:"rtx-4060-gaming"|"high-end-gaming";
  title:string;
  description:string;
  highlights:readonly string[];
  productIds:readonly string[];
}

export const BUILDER_TEMPLATES:readonly BuilderTemplate[]=[
  {
    id:"rtx-4060-gaming",
    title:"RTX 4060 Gaming PC",
    description:"A balanced 1080p/1440p gaming starting point with current AM5 parts.",
    highlights:["Ryzen 5 9600X","RTX 4060","32 GB DDR5","1 TB NVMe"],
    productIds:[
      "buildcores-7c3451cf-80fc-4040-a23a-a83bdb494606",
      "buildcores-cc0a0e08-bc25-4539-af92-952cced58623",
      "buildcores-43bae772-f491-41d8-abbb-4dafa7496121",
      "buildcores-ef29d4c6-3a70-42cc-9952-34d38eeed6ad",
      "buildcores-537ab009-fdcd-47ae-80db-8f73173e6e0d",
      "buildcores-62108dd6-df4d-4df1-bb13-83644d858991",
      "buildcores-1418de1e-5d91-4338-9188-16b777ebddab",
      "buildcores-748b426b-9bf2-4173-9045-50df084150ec",
    ],
  },
  {
    id:"high-end-gaming",
    title:"High-End Gaming PC",
    description:"A flagship AM5 and RTX 5090 build ready for demanding games and heavy workloads.",
    highlights:["Ryzen 9 9950X3D","RTX 5090","64 GB DDR5","4 TB NVMe"],
    productIds:[
      "buildcores-924ccee8-981d-4472-b71a-eb9744319c54",
      "buildcores-cf33502b-5930-4faa-b387-835d0c65efc1",
      "buildcores-2884d28a-1f15-43c0-822c-d9644be1a26e",
      "buildcores-99807b86-a68c-4294-9d7b-3dbd6e5d3a9c",
      "buildcores-5b292073-e997-48f8-83c7-95f0cf71bb0c",
      "buildcores-fa68196b-913a-4018-878e-e192ae5531df",
      "buildcores-acb672ba-0eca-44c2-9b74-57440606761a",
      "buildcores-8c158a8f-7bb6-4f1c-806d-c0aebcccf4fd",
    ],
  },
];

export type TemplateProductLoader=(id:string)=>Promise<ReferenceProduct>;
export async function loadBuilderTemplate(
  template:BuilderTemplate,
  loadProduct:TemplateProductLoader=fetchCatalogProduct,
):Promise<BuilderSession> {
  const products=await Promise.all(template.productIds.map((id)=>loadProduct(id)));
  let session=createBuilderSession();
  for(const product of products){
    const result=addProductToSession(session,product);
    if(!result.mutation.committed){
      const blocker=result.mutation.report.results.find((item)=>item.blocksMutation)?.message
        ?? "Template product could not be applied safely.";
      throw new Error(`${template.title}: ${blocker}`);
    }
    session=result.session;
  }
  return session;
}
