package com.portfolio.jpa.demo.nplus1;

import com.portfolio.jpa.common.metrics.DemoRun;
import com.portfolio.jpa.demo._framework.ScenarioContributor;
import com.portfolio.jpa.demo._framework.ScenarioMeta;
import com.portfolio.jpa.domain.product.Product;
import com.portfolio.jpa.domain.product.ProductRepository;
import com.portfolio.jpa.domain.review.Review;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductReviewsScenario implements ScenarioContributor {

    private final ProductRepository productRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public ScenarioMeta meta() {
        return new ScenarioMeta(
                "nplus1.product-reviews",
                "n-plus-one",
                "상품별 리뷰 집계 N+1",
                "/lab/n-plus-one?s=nplus1.product-reviews",
                "MEDIUM",
                "상품 20건에 대해 리뷰 컬렉션을 LAZY 반복 접근하며 개수·평균 평점을 집계. Bad는 루프마다 flush+clear로 배치 페치를 회피해 1+20 쿼리, Fixed는 동일 반복 접근이지만 default_batch_fetch_size=100에 의해 IN 묶음 1회로 수렴."
        );
    }

    @DemoRun
    @Transactional(readOnly = true)
    public Map<String, Object> runBad() {
        List<Long> ids = productRepository.findFirst20ProductIds(PageRequest.of(0, 20));
        List<Long> productIds = new ArrayList<>();
        int totalReviewCount = 0;
        Map<Long, Double> averageRatingPerProduct = new LinkedHashMap<>();

        for (Long id : ids) {
            Product p = productRepository.findById(id).orElseThrow();
            List<Review> rs = p.getReviews();
            int cnt = rs.size();
            double avg = cnt == 0 ? 0.0 : rs.stream().mapToInt(Review::getRating).average().orElse(0.0);
            avg = Math.round(avg * 1000.0) / 1000.0;
            productIds.add(id);
            totalReviewCount += cnt;
            averageRatingPerProduct.put(id, avg);
            entityManager.flush();
            entityManager.clear();
        }

        return Map.of("productIds", productIds, "totalReviewCount", totalReviewCount, "averageRatingPerProduct", averageRatingPerProduct);
    }

    @DemoRun
    @Transactional(readOnly = true)
    public Map<String, Object> runFixed() {
        List<Long> ids = productRepository.findFirst20ProductIds(PageRequest.of(0, 20));
        List<Product> products = productRepository.findAllByIds(ids);
        List<Long> productIds = new ArrayList<>();
        int totalReviewCount = 0;
        Map<Long, Double> averageRatingPerProduct = new LinkedHashMap<>();

        for (Product p : products) {
            List<Review> rs = p.getReviews();
            int cnt = rs.size();
            double avg = cnt == 0 ? 0.0 : rs.stream().mapToInt(Review::getRating).average().orElse(0.0);
            avg = Math.round(avg * 1000.0) / 1000.0;
            productIds.add(p.getId());
            totalReviewCount += cnt;
            averageRatingPerProduct.put(p.getId(), avg);
        }

        return Map.of("productIds", productIds, "totalReviewCount", totalReviewCount, "averageRatingPerProduct", averageRatingPerProduct);
    }
}
