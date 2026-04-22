package com.portfolio.jpa.domain.member;

import com.portfolio.jpa.common.audit.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "members",
        uniqueConstraints = @UniqueConstraint(name = "uk_members_email", columnNames = "email"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String email;

    @Column(nullable = false, length = 50)
    private String name;

    private Member(String email, String name) {
        this.email = email;
        this.name = name;
    }

    public static Member create(String email, String name) {
        return new Member(email, name);
    }
}
