const express=require('express');
const app=express();
const mongoose=require('mongoose');
const Listing=require('./models/listing.js')
const path=require('path')
const methodOverride=require("method-override")
const ejsMate=require("ejs-mate")
const  wrapAsync=require("./utils/wrapAsync.js")
const  ExpressError=require("./utils/ExpressError.js") 
const {listingSchema,reviewSchema}=require("./schema.js")
const Review=require("./models/review.js")


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate)
app.use(express.static(path.join(__dirname,'public')))

const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";

main().then(()=>{
    console.log("Connection Successful")
})
.catch((err) => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.get('/',(req,res)=>{
    res.send("Hi, I am root")
})

const validateListing=(req,res,next)=>{
  let {error}=listingSchema.validate(req.body)
  if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
      throw new ExpressError(400,errMsg)
  }
  else{
    next();
  }
}


const validateReview=(req,res,next)=>{
  let {error}=reviewSchema.validate(req.body)
  if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
      throw new ExpressError(400,errMsg)
  }
  else{
    next();
  }
}


//index route
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  }));
  
//New Route
  app.get("/listings/new", (req, res) => {
      res.render("listings/new.ejs");
    });


//show route
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
  }));


//Create Route
app.post("/listings",validateListing,wrapAsync( async (req, res,next) => {
  // if(!req.body.listing){
  //   throw new ExpressError(400,"send valid data for listing")
  // }
    
    const newListing = new Listing(req.body.listing);
    // if(!newListing.title){
    //   throw new ExpressError(400,"Title is missing")
    // } //ANOTHER OPTION FOR SERVER SIDE VALIDATION
    // if(!newListing.description){
    //   throw new ExpressError(400,"Description is missing")
    // }
    // if(!newListing.location){
    //   throw new ExpressError(400,"Location is missing")
    // }
    await newListing.save();
    res.redirect("/listings");
  
}));

//Edit Route
app.get("/listings/:id/edit", async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
  });
  
 // Update Route
  app.put("/listings/:id",validateListing,wrapAsync( async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
  }));
  
  //Delete Route
  app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
  }));
  
//reviews route
app.post('/listings/:id/reviews',validateReview, wrapAsync(async (req, res) => {
  
    let listing = await Listing.findById(req.params.id);
    let newReview=new Review(req.body.review);

    listing.reviews.push(newReview); 

    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`) 
}));

// app.get('/testlisting',async (req,res)=>{
//     let sample=new Listing({
//         title:"My New Villa",
//         description:"Recenty By !",
//         price:1200,
//         location:"Surat,Gujarat",
//         country:"India"
//     })

//     await sample.save();
//     console.log(sample)
//     res.send("Successful")
// })

app.all("*",(req,res,next)=>{
  next(new ExpressError(404,"Page Not Found"))
})

app.use((err,req,res,next)=>{
  let{statusCode=500,message="Somthing went wrong"}=err;
  res.status(statusCode).render("error.ejs",{err})
  //res.status(statusCode).send(message);
})

app.listen(8080,()=>{
    console.log(`server is runnig on port 8080`)
})