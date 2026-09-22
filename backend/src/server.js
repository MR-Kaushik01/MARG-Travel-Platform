import "dotenv/config";import express from "express";import cors from "cors";import helmet from "helmet";import {z} from "zod";import {prisma} from "./db.js";import {hashPassword,verifyPassword,signToken,requireAuth,requireRole} from "./auth.js";
import {createChallenge,verifyChallenge,resendChallenge,otpConfig} from "./otp.js";
const app=express();app.use(helmet());app.use(cors({origin:process.env.CORS_ORIGIN?.split(",").map(x=>x.trim())||true}));app.use(express.json({limit:"100kb"}));
const account=z.object({email:z.string().email(),password:z.string().min(8),name:z.string().min(2).max(100),phone:z.string().min(7).max(30).optional()});
const service=z.object({name:z.string().min(2).max(150),category:z.enum(["HOTEL","ARTISAN","FOOD","TRANSPORT","EXPERIENCE","GUIDE"]),destination:z.string().min(2).max(150),description:z.string().max(2000).optional(),priceMinor:z.number().int().min(0),currency:z.string().length(3).default("INR"),capacity:z.number().int().min(1).max(10000).default(1),contactPhone:z.string().max(30).optional(),published:z.boolean().default(false)});
const booking=z.object({serviceId:z.string(),startAt:z.coerce.date(),endAt:z.coerce.date().optional(),guests:z.number().int().min(1).max(100).default(1)});
const companion=z.object({name:z.string().min(2).max(100),relation:z.string().max(50).optional(),phone:z.string().min(7).max(30)});
const sos=z.object({latitude:z.number().min(-90).max(90).optional(),longitude:z.number().min(-180).max(180).optional(),message:z.string().max(500).optional()});
app.get("/health",async(_q,r)=>{try{await prisma.$queryRaw`SELECT 1`;r.json({ok:true,service:"marg-api",database:"up"})}catch{r.status(503).json({ok:false,database:"down"})}});
async function createUser(x,role,res){const email=x.email.toLowerCase().trim();if(await prisma.user.findUnique({where:{email}}))return res.status(409).json({error:"Email already registered"});const u=await prisma.user.create({data:{email,passwordHash:await hashPassword(x.password),name:x.name.trim(),phone:x.phone,role}});res.status(201).json({user:{id:u.id,email:u.email,name:u.name,phone:u.phone,role:u.role},token:signToken(u)})}

app.get("/api/auth/otp-config",(_req,res)=>res.json(otpConfig()));

async function startRegistration(req,res,role){
 const x=account.parse(req.body);
 const email=x.email.toLowerCase().trim();
 if(await prisma.user.findUnique({where:{email}}))return res.status(409).json({error:"Email already registered"});
 const result=await createChallenge(prisma,{...x,email,role,purpose:"REGISTER",passwordHash:await hashPassword(x.password)});
 res.status(201).json(result);
}
app.post("/api/auth/register/start",async(req,res,next)=>{try{await startRegistration(req,res,"TRAVELER")}catch(e){next(e)}});
app.post("/api/auth/provider-register/start",async(req,res,next)=>{try{await startRegistration(req,res,"VENDOR")}catch(e){next(e)}});
app.post("/api/auth/register/verify",async(req,res,next)=>{try{
 const x=z.object({challengeId:z.string(),emailOtp:z.string().length(6),smsOtp:z.string().length(6).optional()}).parse(req.body);
 const c=await verifyChallenge(prisma,x.challengeId,x.emailOtp,x.smsOtp);
 if(!c.verified)return res.status(400).json({error:"Both OTPs are required."});
 if(await prisma.user.findUnique({where:{email:c.email}}))return res.status(409).json({error:"Email already registered"});
const u = await prisma.user.create({
  data: {
    email: c.email,
    passwordHash: c.passwordHash,
    name: c.name,
    role: c.role
  }
});
 await prisma.otpChallenge.delete({where:{id:c.id}});
 res.status(201).json({user:{id:u.id,email:u.email,name:u.name,phone:u.phone,role:u.role},token:signToken(u)});
}catch(e){next(e)}});

app.post("/api/auth/login/start",async(req,res,next)=>{try{
 const x=z.object({email:z.string().email(),password:z.string(),role:z.enum(["TRAVELER","VENDOR"])}).parse(req.body);
 const u=await prisma.user.findUnique({where:{email:x.email.toLowerCase().trim()}});
 if(!u||u.role!==x.role||!(await verifyPassword(x.password,u.passwordHash)))return res.status(401).json({error:"Invalid account email or password"});
 const result=await createChallenge(prisma,{email:u.email,phone:u.phone,name:u.name,role:u.role,purpose:"LOGIN"});
 res.json({...result,user:{id:u.id,email:u.email,name:u.name,phone:u.phone,role:u.role}});
}catch(e){next(e)}});
app.post("/api/auth/otp/resend",async(req,res,next)=>{try{const x=z.object({challengeId:z.string()}).parse(req.body);res.json(await resendChallenge(prisma,x.challengeId))}catch(e){next(e)}});
app.post("/api/auth/login/verify",async(req,res,next)=>{try{
 const x=z.object({challengeId:z.string(),emailOtp:z.string().length(6),smsOtp:z.string().length(6).optional()}).parse(req.body);
const c = await verifyChallenge(
  prisma,
  x.challengeId,
  x.emailOtp,
  null
);

if (!c.verified) {
  return res.status(400).json({ error: "Email OTP is required." });
}
 const u=await prisma.user.findUnique({where:{email:c.email}});
 if(!u||u.role!==c.role)return res.status(401).json({error:"Invalid account"});
 await prisma.otpChallenge.delete({where:{id:c.id}});
 res.json({user:{id:u.id,email:u.email,name:u.name,phone:u.phone,role:u.role},token:signToken(u)});
}catch(e){next(e)}});

// Password login remains available for ADMIN accounts. Traveller and Service Provider UI uses OTP login.
app.post("/api/auth/login",async(req,res,next)=>{try{const x=z.object({email:z.string().email(),password:z.string()}).parse(req.body),u=await prisma.user.findUnique({where:{email:x.email.toLowerCase().trim()}});if(!u||!(await verifyPassword(x.password,u.passwordHash)))return res.status(401).json({error:"Invalid email or password"});if(u.role!=="ADMIN")return res.status(403).json({error:"Traveller and Service Provider login requires OTP verification."});res.json({user:{id:u.id,email:u.email,name:u.name,phone:u.phone,role:u.role},token:signToken(u)})}catch(e){next(e)}});
app.get("/api/me",requireAuth,(req,res)=>res.json({user:req.user}));

// Published services are public to travellers.
app.get("/api/services",async(req,res,next)=>{try{const where={published:true,...(req.query.category?{category:String(req.query.category)}:{}),...(req.query.destination?{destination:{contains:String(req.query.destination),mode:"insensitive"}}:{})};const services=await prisma.service.findMany({where,include:{provider:{select:{id:true,name:true}}},orderBy:{createdAt:"desc"}});res.json({services})}catch(e){next(e)}});
// Provider creates a service; publication immediately exposes it to traveller UI.
app.post("/api/services",requireAuth,requireRole("VENDOR","ADMIN"),async(req,res,next)=>{try{const x=service.parse(req.body),provider=await prisma.user.findUnique({where:{id:req.user.id},select:{providerApproved:true}});if(req.user.role==="VENDOR"&&!provider?.providerApproved)return res.status(403).json({error:"Service Provider approval required before publishing services"});const s=await prisma.service.create({data:{...x,providerId:req.user.id}});res.status(201).json({service:s})}catch(e){next(e)}});
app.get("/api/provider/services",requireAuth,requireRole("VENDOR","ADMIN"),async(req,res,next)=>{try{res.json({services:await prisma.service.findMany({where:{providerId:req.user.id},orderBy:{createdAt:"desc"}})})}catch(e){next(e)}});
app.patch("/api/provider/services/:id",requireAuth,requireRole("VENDOR","ADMIN"),async(req,res,next)=>{try{const x=service.partial().parse(req.body),old=await prisma.service.findFirst({where:{id:req.params.id,providerId:req.user.id}});if(!old)return res.status(404).json({error:"Service not found"});res.json({service:await prisma.service.update({where:{id:old.id},data:x})})}catch(e){next(e)}});

app.post("/api/bookings",requireAuth,requireRole("TRAVELER"),async(req,res,next)=>{try{const x=booking.parse(req.body),s=await prisma.service.findFirst({where:{id:x.serviceId,published:true},include:{provider:{select:{name:true}}}});if(!s)return res.status(404).json({error:"Published service not found"});if(x.guests>s.capacity)return res.status(400).json({error:"Requested guests exceed capacity"});const type=s.category==="HOTEL"?"HOTEL":s.category==="TRANSPORT"?"TRANSPORT":"EXPERIENCE";const b=await prisma.booking.create({data:{userId:req.user.id,serviceId:s.id,type,providerName:s.provider.name,destination:s.destination,startAt:x.startAt,endAt:x.endAt,guests:x.guests,amountMinor:s.priceMinor*x.guests,currency:s.currency}});res.status(201).json({booking:b})}catch(e){next(e)}});
app.get("/api/bookings",requireAuth,requireRole("TRAVELER"),async(req,res,next)=>{try{res.json({bookings:await prisma.booking.findMany({where:{userId:req.user.id},include:{service:true},orderBy:{startAt:"desc"}})})}catch(e){next(e)}});

app.post("/api/companions",requireAuth,requireRole("TRAVELER"),async(req,res,next)=>{try{const x=companion.parse(req.body);res.status(201).json({companion:await prisma.emergencyContact.create({data:{...x,userId:req.user.id}})})}catch(e){next(e)}});
app.get("/api/companions",requireAuth,requireRole("TRAVELER"),async(req,res,next)=>{try{res.json({companions:await prisma.emergencyContact.findMany({where:{userId:req.user.id},orderBy:{createdAt:"desc"}})})}catch(e){next(e)}});
app.post("/api/sos",requireAuth,requireRole("TRAVELER"),async(req,res,next)=>{try{const x=sos.parse(req.body),alert=await prisma.sosAlert.create({data:{...x,userId:req.user.id}});console.log("[SOS]",alert.id,req.user.id);res.status(201).json({alert,message:"SOS recorded. Connect a vetted emergency notification/escalation provider before production."})}catch(e){next(e)}});


// ADMIN CONTROL CENTER
app.get("/api/admin/stats",requireAuth,requireRole("ADMIN"),async(_req,res,next)=>{try{
 const [travellers,providers,services,publishedServices,bookings,activeSos]=await Promise.all([
  prisma.user.count({where:{role:"TRAVELER"}}),prisma.user.count({where:{role:"VENDOR"}}),prisma.service.count(),prisma.service.count({where:{published:true}}),prisma.booking.count(),prisma.sosAlert.count({where:{status:"ACTIVE"}})
 ]);
 res.json({stats:{travellers,providers,services,publishedServices,bookings,activeSos,pendingProviders:await prisma.user.count({where:{role:"VENDOR",providerApproved:false}})}})
}catch(e){next(e)}});
app.get("/api/admin/users",requireAuth,requireRole("ADMIN"),async(req,res,next)=>{try{
 const role=String(req.query.role||"TRAVELER");if(!["TRAVELER","VENDOR","ADMIN"].includes(role))return res.status(400).json({error:"Invalid role"});
 const users=await prisma.user.findMany({where:{role},select:{id:true,name:true,email:true,phone:true,role:true,providerApproved:true,createdAt:true,services:{select:{id:true,name:true,published:true,category:true}}},orderBy:{createdAt:"desc"}});
 res.json({users})
}catch(e){next(e)}});
app.post("/api/admin/providers/:id/approve",requireAuth,requireRole("ADMIN"),async(req,res,next)=>{try{
 const u=await prisma.user.update({where:{id:req.params.id},data:{providerApproved:true},select:{id:true,name:true,email:true,role:true,providerApproved:true}});
 res.json({user:u})
}catch(e){next(e)}});
app.get("/api/admin/services",requireAuth,requireRole("ADMIN"),async(_req,res,next)=>{try{
 const services=await prisma.service.findMany({include:{provider:{select:{id:true,name:true,email:true,providerApproved:true}}},orderBy:{createdAt:"desc"}});
 res.json({services})
}catch(e){next(e)}});
app.get("/api/admin/bookings",requireAuth,requireRole("ADMIN"),async(_req,res,next)=>{try{
 const bookings=await prisma.booking.findMany({include:{user:{select:{name:true,email:true}},service:{select:{name:true,category:true}}},orderBy:{createdAt:"desc"}});
 res.json({bookings})
}catch(e){next(e)}});
app.get("/api/admin/sos",requireAuth,requireRole("ADMIN"),async(_req,res,next)=>{try{
 const alerts=await prisma.sosAlert.findMany({include:{user:{select:{name:true,email:true,phone:true}}},orderBy:{triggeredAt:"desc"},take:100});
 res.json({alerts})
}catch(e){next(e)}});
app.post("/api/admin/sos/:id/resolve",requireAuth,requireRole("ADMIN"),async(req,res,next)=>{try{
 const alert=await prisma.sosAlert.update({where:{id:req.params.id},data:{status:"RESOLVED",resolvedAt:new Date()}});
 res.json({alert})
}catch(e){next(e)}});

app.use((e,_q,r,_n)=>{if(e?.name==="ZodError")return r.status(400).json({error:"Invalid request",details:e.issues});console.error(e);r.status(500).json({error:"Internal server error"})});
app.listen(Number(process.env.PORT||4000),()=>console.log("MARG API running"));
