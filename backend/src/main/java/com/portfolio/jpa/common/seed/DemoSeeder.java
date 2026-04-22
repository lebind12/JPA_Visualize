package com.portfolio.jpa.common.seed;

import com.portfolio.jpa.domain.member.Member;
import com.portfolio.jpa.domain.member.MemberRepository;
import com.portfolio.jpa.domain.order.Order;
import com.portfolio.jpa.domain.order.OrderItem;
import com.portfolio.jpa.domain.order.OrderRepository;
import com.portfolio.jpa.domain.order.OrderStatus;
import com.portfolio.jpa.domain.product.Category;
import com.portfolio.jpa.domain.product.CategoryRepository;
import com.portfolio.jpa.domain.product.Product;
import com.portfolio.jpa.domain.product.ProductRepository;
import com.portfolio.jpa.domain.review.Review;
import com.portfolio.jpa.domain.review.ReviewRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Slf4j
@Component
@Profile("local")
@RequiredArgsConstructor
public class DemoSeeder implements ApplicationRunner {

    private final MemberRepository memberRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private static final int FLUSH_BATCH = 500;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (memberRepository.count() > 0) {
            log.info("seed skipped — 이미 데이터가 존재합니다.");
            return;
        }

        Random random = new Random(42L);

        // 1. Category 10개
        List<Category> categories = seedCategories();

        // 2. Member 50개
        List<Member> members = seedMembers();

        // 3. Product 500개
        List<Product> products = seedProducts(random, categories);

        // 4. Order 5000개 + OrderItem ~20000개
        seedOrders(random, members, products);

        // 5. Review 10000개
        seedReviews(random, members, products);
    }

    private List<Category> seedCategories() {
        String[] names = {"전자기기", "의류", "식품", "스포츠", "도서", "가구", "뷰티", "완구", "자동차용품", "반려동물"};
        List<Category> categories = new ArrayList<>();
        for (String name : names) {
            categories.add(categoryRepository.save(Category.create(name)));
        }
        entityManager.flush();
        entityManager.clear();
        log.info("seeded {} categories", categories.size());
        return categoryRepository.findAll();
    }

    private List<Member> seedMembers() {
        List<Member> members = new ArrayList<>();
        for (int i = 1; i <= 50; i++) {
            members.add(memberRepository.save(Member.create("user-" + i + "@example.com", "사용자" + i)));
            if (i % FLUSH_BATCH == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        entityManager.flush();
        entityManager.clear();
        log.info("seeded {} members", members.size());
        return memberRepository.findAll();
    }

    private List<Product> seedProducts(Random random, List<Category> categories) {
        List<Product> saved = new ArrayList<>();
        for (int i = 1; i <= 500; i++) {
            Category category = categories.get(random.nextInt(categories.size()));
            int price = 1000 + random.nextInt(99001); // 1000 ~ 100000
            int stock = 10 + random.nextInt(991);     // 10 ~ 1000
            saved.add(productRepository.save(Product.create("상품-" + i, price, stock, category)));
            if (i % FLUSH_BATCH == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        entityManager.flush();
        entityManager.clear();
        log.info("seeded {} products", saved.size());
        return productRepository.findAll();
    }

    private void seedOrders(Random random, List<Member> members, List<Product> products) {
        int totalItems = 0;
        for (int i = 1; i <= 5000; i++) {
            Member member = members.get(random.nextInt(members.size()));

            // 한 주문당 1~8개 아이템
            int itemCount = 1 + random.nextInt(8);
            List<OrderItem> items = new ArrayList<>();
            for (int j = 0; j < itemCount; j++) {
                Product product = products.get(random.nextInt(products.size()));
                int qty = 1 + random.nextInt(5);
                items.add(OrderItem.create(product, qty));
            }

            // 상태 분포: COMPLETED 85% / PENDING 10% / CANCELLED 5%
            OrderStatus status = pickStatus(random);

            // 과거 90일 내 랜덤 시각
            long daysAgo = random.nextInt(90);
            long secondsAgo = random.nextInt(86400);
            LocalDateTime orderedAt = LocalDateTime.now().minusDays(daysAgo).minusSeconds(secondsAgo);

            Order order = Order.createWithOrderedAt(member, items, orderedAt, status);
            orderRepository.save(order);
            totalItems += items.size();

            if (i % FLUSH_BATCH == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        entityManager.flush();
        entityManager.clear();
        log.info("seeded {} orders, {} order_items", 5000, totalItems);
    }

    private void seedReviews(Random random, List<Member> members, List<Product> products) {
        String[] templates = {
                "정말 좋은 상품입니다.", "배송이 빠르고 품질이 좋아요.", "가격 대비 훌륭합니다.",
                "다음에도 구매할 예정입니다.", "포장이 꼼꼼해서 좋았어요.", "기대 이상의 품질입니다.",
                "조금 아쉬운 점이 있지만 괜찮아요.", "보통이에요.", "별로 추천하지 않습니다.", "재구매 의사 있습니다."
        };

        for (int i = 1; i <= 10000; i++) {
            Product product = products.get(random.nextInt(products.size()));
            Member member = members.get(random.nextInt(members.size()));

            // rating 1~5, 4~5 쏠림 (70% 확률로 4 또는 5)
            int rating = pickRating(random);
            String content = templates[random.nextInt(templates.length)];

            reviewRepository.save(Review.create(product, member, rating, content));

            if (i % FLUSH_BATCH == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        entityManager.flush();
        entityManager.clear();
        log.info("seeded {} reviews", 10000);
    }

    private OrderStatus pickStatus(Random random) {
        int roll = random.nextInt(100);
        if (roll < 85) return OrderStatus.COMPLETED;
        if (roll < 95) return OrderStatus.PENDING;
        return OrderStatus.CANCELLED;
    }

    private int pickRating(Random random) {
        int roll = random.nextInt(100);
        if (roll < 40) return 5;
        if (roll < 70) return 4;
        if (roll < 85) return 3;
        if (roll < 93) return 2;
        return 1;
    }
}
