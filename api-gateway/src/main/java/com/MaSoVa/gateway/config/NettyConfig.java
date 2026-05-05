package com.MaSoVa.gateway.config;

import io.netty.channel.ChannelOption;
import org.springframework.boot.web.embedded.netty.NettyReactiveWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class NettyConfig {

    /**
     * Configure Netty HTTP server with increased header size limit
     */
    @Bean
    public WebServerFactoryCustomizer<NettyReactiveWebServerFactory> nettyCustomizer() {
        return factory -> factory.addServerCustomizers(httpServer ->
                httpServer.httpRequestDecoder(spec -> spec
                        .maxHeaderSize(65536) // 64KB - increased from default 8KB
                        .maxInitialLineLength(8192)
                        .validateHeaders(true)
                )
        );
    }

    /**
     * Configure Netty HTTP client with increased header size limit for outbound requests
     */
    @Bean
    public HttpClient httpClient() {
        return HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10000)
                .responseTimeout(Duration.ofSeconds(30))
                .httpResponseDecoder(spec -> spec
                        .maxHeaderSize(65536) // 64KB
                        .maxInitialLineLength(8192)
                        .validateHeaders(true)
                );
    }

    /**
     * Provide a ReactorClientHttpConnector with custom HttpClient
     */
    @Bean
    public ReactorClientHttpConnector reactorClientHttpConnector(HttpClient httpClient) {
        return new ReactorClientHttpConnector(httpClient);
    }
}
