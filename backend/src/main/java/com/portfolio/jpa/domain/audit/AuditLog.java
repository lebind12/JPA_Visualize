package com.portfolio.jpa.domain.audit;

import com.portfolio.jpa.common.audit.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "audit_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuditLog extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false, length = 200)
    private String message;

    private AuditLog(Long memberId, String message) {
        this.memberId = memberId;
        this.message = message;
    }

    public static AuditLog create(long memberId, String message) {
        return new AuditLog(memberId, message);
    }
}
