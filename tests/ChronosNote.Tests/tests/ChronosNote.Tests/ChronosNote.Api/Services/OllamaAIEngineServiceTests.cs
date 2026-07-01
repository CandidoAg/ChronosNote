using Xunit;
using FluentAssertions;
using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using Moq.Protected;

namespace ChronosNote.Api.Services;

public class OllamaAIEngineServiceTests
{
    [Fact]
    public async Task ProcessTextAsync_Should_Return_Ai_Response_Field_On_Success()
    {
        var handlerMock = new Mock<HttpMessageHandler>();
        string fakeJsonResponse = "{ \"response\": \"{ \\\"result\\\": \\\"Resumen IA\\\" }\" }";

        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(fakeJsonResponse)
            });

        var httpClient = new HttpClient(handlerMock.Object);
        var service = new OllamaAIEngineService(httpClient);

        var result = await service.ProcessTextAsync("Texto largo", "summarize");

        result.Should().Contain("Resumen IA");
    }

    [Fact]
    public async Task ProcessTextAsync_Should_Catch_Http_Error_And_Return_Graceful_Fallback()
    {
        var handlerMock = new Mock<HttpMessageHandler>();
        handlerMock.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>()
            )
            .ThrowsAsync(new HttpRequestException("Connection refused"));

        var httpClient = new HttpClient(handlerMock.Object);
        var service = new OllamaAIEngineService(httpClient);

        var result = await service.ProcessTextAsync("Texto largo", "summarize");

        result.Should().Contain("Error de conexión con el motor IA local");
    }
}