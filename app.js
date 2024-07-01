const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsmate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { lisgingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsmate);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("hi, i am root");
});

const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(404, errMsg);
  } else {
    next();
  }
};

const validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(404, errMsg);
  } else {
    next();
  }
};
// index route

app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  })
);

// New route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

// Show route
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", { listing });
  })
);

// Create Route
app.post(
  "/listings",
  validateListing,
  wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("listings");
  })
);

// Edit route
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
  })
);

// update route
app.put(
  "/listings/:id",
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect("/listings");
  })
);

// Delete route
app.delete(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
  })
);

// Review
// post route
// app.post(
//   "/listings/:id/reviews",
//   validateReview,
//   wrapAsync(async (req, res) => {
//     let listing = await Listing.findById(req.params.id);
//     let newReview = new Review(req.body.review);
//     // console.log("new review", newReview);
//     listing.reviews.push(newReview);
//     await newReview.save();

//     await listing.save();
//     console.log("new review saved");
//     res.send("new review saved");

//      res.redirect(`/listings/${listing._id}`);
//   })
// );

// Review
// post route
app.post(
  "/listings/:id/reviews",
  validateReview,
  wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    console.log("new review", newReview);
    listing.reviews.push(newReview);
    await newReview.save();

    let newListing = await listing.save();
    console.log("new Listing", newListing);
    res.redirect(`/listings/${listing._id}`);
  })
);

// app.get("/testlisting", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "my home",
//     description: "very big house",

//     price: 1200,
//     location: "jaipur,rajasthan",
//     country: "india",
//   });
//   await sampleListing.save();
//   console.log("sample was saved");
//   res.send("testing successfull");
// });

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "page not found!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong!" } = err;
  res.status(statusCode).render("listings/error.ejs", { message });
});

app.listen(8080, () => {
  console.log("app is listing on the 8080");
});
