package com.portfolio.jpa.support;

import com.portfolio.jpa.domain.member.Member;
import com.portfolio.jpa.domain.order.Order;
import com.portfolio.jpa.domain.order.OrderItem;
import com.portfolio.jpa.domain.order.OrderStatus;
import com.portfolio.jpa.domain.product.Category;
import com.portfolio.jpa.domain.product.Product;
import jakarta.persistence.EntityManager;

import java.time.LocalDateTime;
import java.util.List;

public final class OrderListFixture {

    private OrderListFixture() {}

    /**
     * Category 1개, Member 3명, Product 5개, Order 10개(각 OrderItem 3개)를 영속화한다.
     * 결정적(deterministic) 시드 — 쿼리 수가 재현 가능하도록 고정된 구조.
     */
    public static void seed(EntityManager em) {
        Category category = Category.create("테스트카테고리");
        em.persist(category);

        Member m1 = Member.create("fixture1@test.com", "회원1");
        Member m2 = Member.create("fixture2@test.com", "회원2");
        Member m3 = Member.create("fixture3@test.com", "회원3");
        em.persist(m1);
        em.persist(m2);
        em.persist(m3);

        Product p1 = Product.create("상품A", 1000, 100, category);
        Product p2 = Product.create("상품B", 2000, 100, category);
        Product p3 = Product.create("상품C", 3000, 100, category);
        Product p4 = Product.create("상품D", 4000, 100, category);
        Product p5 = Product.create("상품E", 5000, 100, category);
        em.persist(p1);
        em.persist(p2);
        em.persist(p3);
        em.persist(p4);
        em.persist(p5);

        Member[] members = {m1, m2, m3};
        Product[][] productSets = {
            {p1, p2, p3},
            {p2, p3, p4},
            {p3, p4, p5},
            {p4, p5, p1},
            {p5, p1, p2},
            {p1, p3, p5},
            {p2, p4, p1},
            {p3, p5, p2},
            {p4, p1, p3},
            {p5, p2, p4},
        };

        LocalDateTime base = LocalDateTime.of(2024, 1, 1, 0, 0, 0);
        for (int i = 0; i < 10; i++) {
            Member member = members[i % 3];
            Product[] prods = productSets[i];
            List<OrderItem> items = List.of(
                OrderItem.create(prods[0], 1),
                OrderItem.create(prods[1], 2),
                OrderItem.create(prods[2], 3)
            );
            Order order = Order.createWithOrderedAt(member, items, base.plusDays(i), OrderStatus.PENDING);
            em.persist(order);
        }

        em.flush();
    }
}
