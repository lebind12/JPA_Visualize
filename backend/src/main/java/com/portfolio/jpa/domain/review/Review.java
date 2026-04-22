package com.portfolio.jpa.domain.review;

import com.portfolio.jpa.common.audit.BaseTimeEntity;
import com.portfolio.jpa.domain.member.Member;
import com.portfolio.jpa.domain.product.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reviews",
        indexes = {
                @Index(name = "idx_reviews_product", columnList = "product_id"),
                @Index(name = "idx_reviews_member", columnList = "member_id")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    private int rating;

    @Column(length = 500)
    private String content;

    private Review(Product product, Member member, int rating, String content) {
        this.product = product;
        this.member = member;
        this.rating = rating;
        this.content = content;
    }

    public static Review create(Product product, Member member, int rating, String content) {
        return new Review(product, member, rating, content);
    }
}
