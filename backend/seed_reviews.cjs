const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Could not connect", err));

// Models definition (minimal for seeding)
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", userSchema, "users");

const productSchema = new mongoose.Schema({
  averageRating: Number,
  reviewsCount: Number
}, { strict: false });
const Product = mongoose.model("Product", productSchema, "products");

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: Number,
  comment: String,
  status: String,
  verifiedPurchase: Boolean,
  createdAt: Date
}, { timestamps: true });
const Review = mongoose.model("Review", reviewSchema, "reviews");

const questionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  question: String,
  answer: String,
  isAnswered: Boolean,
  createdAt: Date
}, { timestamps: true });
const Question = mongoose.model("Question", questionSchema, "questions");

const mockReviews = [
  { rating: 5, comment: "Đồng hồ rất đẹp, cầm đầm tay, đúng như mô tả. Shop giao hàng nhanh.", status: "approved" },
  { rating: 4, comment: "Thiết kế sang trọng nhưng hộp hơi móp một chút do vận chuyển. Đồng hồ vẫn xài tốt.", status: "approved" },
  { rating: 5, comment: "Mua tặng chồng nhân kỷ niệm, anh ấy rất thích. Đáng đồng tiền bát gạo!", status: "approved" },
  { rating: 5, comment: "Lên tay nhìn rất sang, máy chạy chuẩn giờ. Sẽ ủng hộ shop dài dài.", status: "approved" },
  { rating: 3, comment: "Cũng được, dây da hơi cứng nhưng đeo một thời gian chắc sẽ mềm ra.", status: "approved" },
  { rating: 5, comment: "Hàng chuẩn chính hãng, check code đầy đủ, bảo hành đàng hoàng.", status: "approved" },
  { rating: 4, comment: "Màu thực tế hơi nhạt hơn trong ảnh một xíu, cơ mà vẫn đẹp.", status: "approved" },
  { rating: 5, comment: "Đóng gói cẩn thận, nhân viên tư vấn nhiệt tình.", status: "approved" },
  { rating: 1, comment: "Giao nhầm màu, yêu cầu đổi trả ngay lập tức!", status: "pending" },
  { rating: 2, comment: "Mới mua về mà đã bị đứng kim, shop xem lại bảo hành.", status: "hidden" },
];

const mockQuestions = [
  { q: "Mẫu này cổ tay 16cm đeo vừa không shop?", a: "Chào bạn, mẫu này size 40mm nên cổ tay 16cm đeo rất vừa vặn và đẹp ạ.", answered: true },
  { q: "Đồng hồ có chống nước đi bơi được không?", a: "Sản phẩm có độ chống nước 10ATM, bạn hoàn toàn có thể đi bơi thoải mái nhé.", answered: true },
  { q: "Bảo hành bao lâu vậy shop?", a: "Bên mình bảo hành chính hãng 5 năm và hỗ trợ thay pin miễn phí trọn đời ạ.", answered: true },
  { q: "Có giao hàng hỏa tốc trong SG không?", a: "Dạ shop có hỗ trợ giao hỏa tốc trong 2h tại khu vực TP.HCM ạ.", answered: true },
  { q: "Sản phẩm này còn hàng không?", a: null, answered: false },
  { q: "Có hỗ trợ trả góp qua thẻ tín dụng không?", a: null, answered: false },
];

async function seed() {
  try {
    const products = await Product.find({}).limit(10);
    const users = await User.find({}).limit(5);

    if (products.length === 0 || users.length === 0) {
      console.log("No products or users found.");
      return;
    }

    console.log(`Found ${products.length} products and ${users.length} users.`);

    // Delete existing (except the first admin one just in case, but let's just clear for clean state)
    await Review.deleteMany({});
    await Question.deleteMany({});
    console.log("Cleared old reviews and questions.");

    let totalReviews = 0;
    let totalQuestions = 0;

    for (let p of products) {
      // Create 2-4 reviews per product
      const numReviews = Math.floor(Math.random() * 3) + 2; 
      let sumRating = 0;
      let validReviewsCount = 0;

      for (let i = 0; i < numReviews; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const reviewData = mockReviews[Math.floor(Math.random() * mockReviews.length)];
        
        // Random date in last 30 days
        const date = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);

        try {
          await Review.create({
            product: p._id,
            user: user._id,
            rating: reviewData.rating,
            comment: reviewData.comment,
            status: reviewData.status,
            verifiedPurchase: Math.random() > 0.3,
            createdAt: date
          });
          
          if (reviewData.status === 'approved') {
            sumRating += reviewData.rating;
            validReviewsCount++;
          }
          totalReviews++;
        } catch(e) {
          // ignore duplicate key errors if same user on same product
        }
      }

      // Update product rating
      if (validReviewsCount > 0) {
        p.averageRating = sumRating / validReviewsCount;
        p.reviewsCount = validReviewsCount;
        await p.save();
      }

      // Create 1-2 questions per product
      const numQuestions = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numQuestions; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const questionData = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
        
        const date = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
        
        await Question.create({
          product: p._id,
          user: user._id,
          question: questionData.q,
          answer: questionData.a,
          isAnswered: questionData.answered,
          createdAt: date
        });
        totalQuestions++;
      }
    }

    console.log(`Seeded ${totalReviews} reviews and ${totalQuestions} questions successfully!`);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
